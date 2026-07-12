import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VenteService {
  constructor(private prisma: PrismaService) { }

  // ================= CREATE =================
  async create(dto: any, compteId: string) {
    const { lignes, paiements, utilisateurId, montantTotal, clientId } = dto;

    if (!lignes?.length) {
      throw new BadRequestException('Aucun produit dans la vente');
    }

    // ================= VALIDATION TOTAL LIGNES =================
    let total = 0;
    for (const l of lignes) {
      if (l.quantite <= 0) throw new BadRequestException('Quantité invalide');
      if (l.prix < 0) throw new BadRequestException('Prix invalide');
      total += l.quantite * l.prix;
    }

    if (total !== montantTotal) {
      throw new BadRequestException('Montant incorrect');
    }

    // ================= VALIDATION PAIEMENTS =================
    const totalPaiements = paiements.reduce((sum, p) => sum + p.montant, 0);

    if (totalPaiements > montantTotal) {
      throw new BadRequestException(
        'Le total des paiements ne peut pas dépasser le montant de la vente',
      );
    }

    const estVenteACredit = totalPaiements < montantTotal;
    const montantDette = montantTotal - totalPaiements;

    if (estVenteACredit && !clientId) {
      throw new BadRequestException(
        'Un client est requis pour enregistrer une vente à crédit (paiement partiel)',
      );
    }

    if (estVenteACredit) {
      const client = await this.prisma.client.findFirst({
        where: { id: clientId, compteId },
      });
      if (!client) {
        throw new BadRequestException('Client introuvable');
      }

      if (client.limiteCredit !== null && client.limiteCredit !== undefined) {
        const dettesEnCours = await this.prisma.dette.aggregate({
          where: { clientId, statut: 'EN_COURS' },
          _sum: { montantRestant: true },
        });

        const detteActuelle = dettesEnCours._sum.montantRestant || 0;
        const detteApresVente = detteActuelle + montantDette;

        if (detteApresVente > client.limiteCredit) {
          const disponible = client.limiteCredit - detteActuelle;
          throw new BadRequestException(
            `Plafond de crédit dépassé pour ${client.nom}. ` +
            `Limite : ${client.limiteCredit.toLocaleString('fr-FR')} FCFA — ` +
            `Dette actuelle : ${detteActuelle.toLocaleString('fr-FR')} FCFA — ` +
            `Disponible : ${Math.max(disponible, 0).toLocaleString('fr-FR')} FCFA`,
          );
        }
      }
    }

    // ================= VÉRIFICATION LIMITE GLOBALE DE DETTES (tous clients confondus) =================
    if (estVenteACredit) {
      const compte = await this.prisma.compte.findUnique({
        where: { id: compteId },
        select: { limiteGlobaleDette: true },
      });

      if (compte?.limiteGlobaleDette) {
        const totalDettesEnCours = await this.prisma.dette.aggregate({
          where: { compteId, statut: 'EN_COURS' },
          _sum: { montantRestant: true },
        });

        const totalActuel = totalDettesEnCours._sum.montantRestant || 0;
        const totalApresVente = totalActuel + montantDette;

        if (totalApresVente > compte.limiteGlobaleDette) {
          throw new BadRequestException(
            `Limite globale de dettes dépassée. ` +
            `Limite : ${compte.limiteGlobaleDette.toLocaleString('fr-FR')} FCFA — ` +
            `Total actuel dû : ${totalActuel.toLocaleString('fr-FR')} FCFA — ` +
            `Disponible : ${Math.max(compte.limiteGlobaleDette - totalActuel, 0).toLocaleString('fr-FR')} FCFA`,
          );
        }
      }
    }

    // ================= STOCK CHECK — SORTI DE LA TRANSACTION =================
    const produitIds = lignes.map((l) => l.produitId);

    const produits = await this.prisma.produit.findMany({
      where: { id: { in: produitIds }, compteId },
    });

    if (produits.length !== produitIds.length) {
      throw new BadRequestException('Un ou plusieurs produits sont introuvables');
    }

    const entrees = await this.prisma.entreeStock.groupBy({
      by: ['produitId'],
      where: { produitId: { in: produitIds } },
      _sum: { quantite: true },
    });

    const sorties = await this.prisma.sortieStock.groupBy({
      by: ['produitId'],
      where: { produitId: { in: produitIds } },
      _sum: { quantite: true },
    });

    const entreesMap = new Map(entrees.map((e) => [e.produitId, e._sum.quantite || 0]));
    const sortiesMap = new Map(sorties.map((s) => [s.produitId, s._sum.quantite || 0]));
    const produitsMap = new Map(produits.map((p) => [p.id, p]));

    for (const l of lignes) {
      const stock = (entreesMap.get(l.produitId) || 0) - (sortiesMap.get(l.produitId) || 0);
      if (stock < l.quantite) {
        const produit = produitsMap.get(l.produitId);
        throw new BadRequestException(`Stock insuffisant pour ${produit?.nom}`);
      }
    }

    // ================= TRANSACTION : UNIQUEMENT DES ÉCRITURES =================
    return this.prisma.$transaction(async (tx) => {

      const vente = await tx.vente.create({
        data: {
          utilisateurId,
          compteId,
          montantTotal,
          clientId: clientId ?? undefined,
        },
      });

      await tx.ligneVente.createMany({
        data: lignes.map((l) => ({
          venteId: vente.id,
          produitId: l.produitId,
          quantite: l.quantite,
          prix: l.prix,
        })),
      });

      await tx.sortieStock.createMany({
        data: lignes.map((l) => ({
          produitId: l.produitId,
          quantite: l.quantite,
          raison: 'VENTE',
          venteId: vente.id,
        })),
      });

      const paiementsValides = paiements.filter((p) => p.montant > 0);
      if (paiementsValides.length > 0) {
        await tx.paiement.createMany({
          data: paiementsValides.map((p) => ({
            venteId: vente.id,
            montant: p.montant,
            methodePaiement: p.methodePaiement,
          })),
        });
      }

      if (totalPaiements > 0) {
        await tx.mouvementCaisse.create({
          data: {
            compteId,
            type: 'ENTREE',
            source: 'VENTE',
            montant: totalPaiements,
            motif: estVenteACredit
              ? `Vente à crédit — acompte reçu (${lignes.length} produit(s))`
              : `Vente enregistrée (${lignes.length} produit(s))`,
            venteId: vente.id,
          },
        });
      }

      if (estVenteACredit) {
        await tx.dette.create({
          data: {
            compteId,
            clientId,
            venteId: vente.id,
            montantInitial: montantDette,
            montantRestant: montantDette,
            statut: 'EN_COURS',
          },
        });
      }

      return vente;

    }, { timeout: 30000 });
  }

  // ================= FIND ALL (SAAS) =================
  async findAll(compteId: string) {
    return this.prisma.vente.findMany({
      where: { compteId },
      include: {
        utilisateur: true,
        client: true,
        lignes: {
          include: { produit: true },
        },
        paiements: true,
        dette: true,
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  // ================= FIND ONE =================
  async findOne(id: string, compteId: string) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, compteId },
      include: {
        utilisateur: true,
        client: true,
        lignes: {
          include: { produit: true },
        },
        paiements: true,
        dette: {
          include: { remboursements: true },
        },
      },
    });

    if (!vente) {
      throw new NotFoundException('Vente introuvable');
    }

    return vente;
  }

  // ================= UPDATE =================
  async update(id: string, dto: any, compteId: string) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, compteId },
    });

    if (!vente) {
      throw new NotFoundException('Vente introuvable');
    }

    return this.prisma.vente.update({
      where: { id },
      data: {
        montantTotal: dto.montantTotal ?? vente.montantTotal,
      },
    });
  }

  // ================= DELETE =================
  async remove(id: string, compteId: string) {
    const vente = await this.prisma.vente.findFirst({
      where: { id, compteId },
      include: { dette: true },
    });

    if (!vente) {
      throw new NotFoundException('Vente introuvable');
    }

    if (vente.dette && vente.dette.statut === 'EN_COURS') {
      throw new BadRequestException(
        'Impossible de supprimer cette vente : une dette est encore en cours sur ce client',
      );
    }

    return this.prisma.$transaction(async (tx) => {

      if (vente.dette) {
        await tx.remboursementDette.deleteMany({
          where: { detteId: vente.dette.id },
        });
        await tx.dette.delete({ where: { id: vente.dette.id } });
      }

      await tx.mouvementCaisse.deleteMany({
        where: { venteId: id },
      });

      await tx.paiement.deleteMany({
        where: { venteId: id },
      });

      await tx.ligneVente.deleteMany({
        where: { venteId: id },
      });

      return tx.vente.delete({
        where: { id },
      });

    });
  }
}