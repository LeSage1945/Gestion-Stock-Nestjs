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
      if (l.quantite <= 0) {
        throw new BadRequestException('Quantité invalide');
      }
      if (l.prix < 0) {
        throw new BadRequestException('Prix invalide');
      }
      total += l.quantite * l.prix;
    }

    if (total !== montantTotal) {
      throw new BadRequestException('Montant incorrect');
    }

    // ================= VALIDATION PAIEMENTS (paiement partiel autorisé) =================
    const totalPaiements = paiements.reduce(
      (sum, p) => sum + p.montant, 0
    );

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

    // Si vente à crédit, on vérifie le client + le plafond de crédit avant d'ouvrir la transaction
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

    return this.prisma.$transaction(async (tx) => {

      // ================= STOCK CHECK SAAS =================
      for (const l of lignes) {
        const produit = await tx.produit.findFirst({
          where: { id: l.produitId, compteId },
        });

        if (!produit) {
          throw new BadRequestException('Produit introuvable');
        }

        const entrees = await tx.entreeStock.aggregate({
          where: { produitId: l.produitId },
          _sum: { quantite: true },
        });

        const sorties = await tx.sortieStock.aggregate({
          where: { produitId: l.produitId },
          _sum: { quantite: true },
        });

        const stock =
          (entrees._sum.quantite || 0) -
          (sorties._sum.quantite || 0);

        if (stock < l.quantite) {
          throw new BadRequestException(
            `Stock insuffisant pour ${produit.nom}`,
          );
        }
      }

      // ================= CREATE VENTE =================
      const vente = await tx.vente.create({
        data: {
          utilisateurId,
          compteId,
          montantTotal,
          clientId: clientId ?? undefined,
        },
      });

      // ================= LIGNES + SORTIES =================
      for (const l of lignes) {
        await tx.ligneVente.create({
          data: {
            venteId: vente.id,
            produitId: l.produitId,
            quantite: l.quantite,
            prix: l.prix,
          },
        });

        await tx.sortieStock.create({
          data: {
            produitId: l.produitId,
            quantite: l.quantite,
            raison: 'VENTE',
            venteId: vente.id,
          },
        });
      }

      // ================= PAIEMENTS (uniquement ce qui est réellement reçu) =================
      for (const p of paiements) {
        if (p.montant <= 0) continue; // ignore les paiements à 0 (cas: vente 100% à crédit)
        await tx.paiement.create({
          data: {
            venteId: vente.id,
            montant: p.montant,
            methodePaiement: p.methodePaiement,
          },
        });
      }

      // ================= MOUVEMENT CAISSE AUTO (seulement le montant encaissé) =================
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

      // ================= CRÉATION DE LA DETTE (si paiement partiel) =================
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

    }, { timeout: 15000 });
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