import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { StatutCommande } from '@prisma/client';

@Injectable()
export class BoutiqueService {
  constructor(private prisma: PrismaService) { }

  // ================= LISTE PRODUITS VISIBLES =================
  async getProduitsVisibles(compteId: string) {
    const produits = await this.prisma.produit.findMany({
      where: { compteId, visibleBoutique: true },
      include: {
        entreesStock: true,
        sortiesStock: true,
      },
    });

    return produits
      .map((p) => {
        const totalEntrees = p.entreesStock.reduce((s, e) => s + e.quantite, 0);
        const totalSorties = p.sortiesStock.reduce((s, e) => s + e.quantite, 0);
        const stockActuel = totalEntrees - totalSorties;

        return {
          id: p.id,
          nom: p.nom,
          marque: p.marque,
          prix: p.prix,
          imageUrl: p.imageUrl,
          description: p.description,
          stockActuel,
        };
      })
      .filter((p) => p.stockActuel > 0);
  }

  // ================= DÉTAIL PRODUIT =================
  async getProduitDetail(produitId: string) {
    const produit = await this.prisma.produit.findFirst({
      where: { id: produitId, visibleBoutique: true },
      include: { entreesStock: true, sortiesStock: true },
    });

    if (!produit) throw new NotFoundException('Produit introuvable');

    const totalEntrees = produit.entreesStock.reduce((s, e) => s + e.quantite, 0);
    const totalSorties = produit.sortiesStock.reduce((s, e) => s + e.quantite, 0);

    return {
      id: produit.id,
      nom: produit.nom,
      marque: produit.marque,
      prix: produit.prix,
      imageUrl: produit.imageUrl,
      description: produit.description,
      stockActuel: totalEntrees - totalSorties,
    };
  }

  // ================= CRÉER COMMANDE =================
  async createCommande(dto: CreateCommandeDto) {
    const { compteId, lignes, typeLivraison } = dto;

    if (typeLivraison === 'LIVRAISON' && !dto.adresseLivraison) {
      throw new BadRequestException("L'adresse de livraison est obligatoire");
    }

    return this.prisma.$transaction(async (tx) => {
      let sousTotal = 0;
      const lignesValidees: { produitId: string; quantite: number; prix: number }[] = [];

      for (const ligne of lignes) {
        const produit = await tx.produit.findFirst({
          where: { id: ligne.produitId, compteId, visibleBoutique: true },
        });

        if (!produit) {
          throw new BadRequestException(`Produit introuvable : ${ligne.produitId}`);
        }

        const entrees = await tx.entreeStock.aggregate({
          where: { produitId: ligne.produitId },
          _sum: { quantite: true },
        });
        const sorties = await tx.sortieStock.aggregate({
          where: { produitId: ligne.produitId },
          _sum: { quantite: true },
        });

        const stockDispo = (entrees._sum.quantite || 0) - (sorties._sum.quantite || 0);

        if (stockDispo < ligne.quantite) {
          throw new BadRequestException(
            `Stock insuffisant pour ${produit.nom}. Disponible : ${stockDispo}`
          );
        }

        sousTotal += produit.prix * ligne.quantite;
        lignesValidees.push({
          produitId: ligne.produitId,
          quantite: ligne.quantite,
          prix: produit.prix,
        });
      }

      const fraisLivraison = typeLivraison === 'LIVRAISON' ? 1000 : 0;
      const montantTotal = sousTotal + fraisLivraison;

      const commande = await tx.commande.create({
        data: {
          compteId,
          clientNom: dto.clientNom,
          clientTelephone: dto.clientTelephone,
          typeLivraison: dto.typeLivraison,
          adresseLivraison: dto.adresseLivraison,
          villeLivraison: dto.villeLivraison,
          fraisLivraison,
          sousTotal,
          montantTotal,
          notesClient: dto.notesClient,
        },
      });

      for (const l of lignesValidees) {
        await tx.ligneCommande.create({
          data: {
            commandeId: commande.id,
            produitId: l.produitId,
            quantite: l.quantite,
            prix: l.prix,
          },
        });
      }

      return commande;
    });
  }

  // ================= DÉTAIL COMMANDE (suivi client) =================
  async getCommande(id: string) {
    const commande = await this.prisma.commande.findFirst({
      where: { id },
      include: {
        lignes: { include: { produit: true } },
        paiements: true,
      },
    });

    if (!commande) throw new NotFoundException('Commande introuvable');
    return commande;
  }

  // ================= LISTE DES COMMANDES (avec filtre statut optionnel) =================
  async getCommandes(compteId: string, statut?: StatutCommande) {
    return this.prisma.commande.findMany({
      where: {
        compteId,
        ...(statut ? { statutCommande: statut } : {}),
      },
      include: {
        lignes: { include: { produit: true } },
        paiements: true,
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  // ================= VALIDER / CHANGER STATUT COMMANDE =================
  async updateStatutCommande(
    id: string,
    statutCommande: StatutCommande,
    utilisateurId?: string,
  ) {
    const commande = await this.prisma.commande.findFirst({
      where: { id },
      include: { lignes: true },
    });

    if (!commande) throw new NotFoundException('Commande introuvable');

    const doitCreerVente =
      statutCommande === 'CONFIRMEE' && commande.statutCommande !== 'CONFIRMEE';

    if (doitCreerVente && !utilisateurId) {
      throw new BadRequestException(
        "utilisateurId est obligatoire pour confirmer une commande (vendeur qui valide)",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const commandeMaj = await tx.commande.update({
        where: { id },
        data: { statutCommande },
      });

      if (!doitCreerVente) {
        return commandeMaj;
      }

      const vente = await tx.vente.create({
        data: {
          compteId: commande.compteId,
          utilisateurId: utilisateurId!,
          montantTotal: commande.montantTotal,
        },
      });

      for (const ligne of commande.lignes) {
        await tx.ligneVente.create({
          data: {
            venteId: vente.id,
            produitId: ligne.produitId,
            quantite: ligne.quantite,
            prix: ligne.prix,
          },
        });

        await tx.sortieStock.create({
          data: {
            produitId: ligne.produitId,
            venteId: vente.id,
            quantite: ligne.quantite,
            raison: `Commande boutique #${commande.id}`,
          },
        });
      }

      await tx.mouvementCaisse.create({
        data: {
          compteId: commande.compteId,
          type: 'ENTREE',
          source: 'VENTE',
          montant: commande.montantTotal,
          motif: `Vente via commande boutique #${commande.id}`,
          venteId: vente.id,
        },
      });

      return commandeMaj;
    });
  }
}