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
      .filter((p) => p.stockActuel > 0); // seulement les produits disponibles
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

    if (!lignes?.length) {
      throw new BadRequestException('Aucun produit dans la commande');
    }

    if (typeLivraison === 'LIVRAISON' && !dto.adresseLivraison) {
      throw new BadRequestException("Adresse de livraison obligatoire");
    }

    const produitsIds = lignes.map(l => l.produitId);

    // ================= 1. CHARGEMENT PRODUITS (HORS TRANSACTION) =================
    const produits = await this.prisma.produit.findMany({
      where: {
        id: { in: produitsIds },
        compteId,
        visibleBoutique: true,
      },
    });

    if (produits.length !== lignes.length) {
      throw new BadRequestException('Produit introuvable');
    }

    // ================= 2. STOCK (HORS TRANSACTION - OPTIMISÉ) =================
    const entrees = await this.prisma.entreeStock.groupBy({
      by: ['produitId'],
      where: { produitId: { in: produitsIds } },
      _sum: { quantite: true },
    });

    const sorties = await this.prisma.sortieStock.groupBy({
      by: ['produitId'],
      where: { produitId: { in: produitsIds } },
      _sum: { quantite: true },
    });

    const stockMap = new Map<string, number>();

    for (const id of produitsIds) {
      const ent = entrees.find(e => e.produitId === id)?._sum.quantite || 0;
      const sor = sorties.find(s => s.produitId === id)?._sum.quantite || 0;
      stockMap.set(id, ent - sor);
    }

    // ================= 3. VALIDATION + CALCUL =================
    let sousTotal = 0;

    const lignesValidees = lignes.map(l => {
      const produit = produits.find(p => p.id === l.produitId)!;

      const stock = stockMap.get(l.produitId) || 0;

      if (stock < l.quantite) {
        throw new BadRequestException(
          `Stock insuffisant pour ${produit.nom} (disponible: ${stock})`
        );
      }

      sousTotal += produit.prix * l.quantite;

      return {
        produitId: l.produitId,
        quantite: l.quantite,
        prix: produit.prix,
      };
    });

    const fraisLivraison = typeLivraison === 'LIVRAISON' ? 1000 : 0;
    const montantTotal = sousTotal + fraisLivraison;

    // ================= 4. TRANSACTION ULTRA LÉGÈRE =================
    return this.prisma.$transaction(
      async (tx) => {
        const commande = await tx.commande.create({
          data: {
            compteId,
            clientNom: dto.clientNom,
            clientTelephone: dto.clientTelephone,
            typeLivraison,
            adresseLivraison: dto.adresseLivraison,
            villeLivraison: dto.villeLivraison,
            fraisLivraison,
            sousTotal,
            montantTotal,
            notesClient: dto.notesClient,
          },
        });

        await tx.ligneCommande.createMany({
          data: lignesValidees.map(l => ({
            commandeId: commande.id,
            produitId: l.produitId,
            quantite: l.quantite,
            prix: l.prix,
          })),
        });

        return commande;
      },
      {
        timeout: 20000, // 🔥 important pour éviter P2028
      }
    );
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

  // ================= VALIDER / CHANGER STATUT COMMANDE =================
  // async updateStatutCommande(id: string, statutCommande: StatutCommande) {
  //   const commande = await this.prisma.commande.findFirst({ where: { id } });

  //   if (!commande) throw new NotFoundException('Commande introuvable');

  //   return this.prisma.commande.update({
  //     where: { id },
  //     data: { statutCommande },
  //   });
  // }

  async updateStatutCommande(id: string, statutCommande: StatutCommande) {

    const commande = await this.prisma.commande.findFirst({
      where: { id },
      include: {
        lignes: true,
      },
    });

    if (!commande) throw new NotFoundException('Commande introuvable');

    return this.prisma.$transaction(async (tx) => {

      // ===============================
      // 🔥 CAS 1 : CONFIRMEE = SORTIE STOCK
      // ===============================
      if (
        statutCommande === 'CONFIRMEE' &&
        commande.statutCommande !== 'CONFIRMEE'
      ) {

        for (const l of commande.lignes) {

          // création sortie stock (comme VenteService)
          await tx.sortieStock.create({
            data: {
              produitId: l.produitId,
              quantite: l.quantite,
              raison: 'COMMANDE_CONFIRMED',
              venteId: null,
            },
          });
        }
      }

      // ===============================
      // 🔥 CAS 2 : ANNULATION après confirmation = RESTOCK
      // ===============================
      if (
        statutCommande === 'ANNULEE' &&
        commande.statutCommande === 'CONFIRMEE'
      ) {

        for (const l of commande.lignes) {

          await tx.entreeStock.create({
            data: {
              produitId: l.produitId,
              quantite: l.quantite,
              prixAchat: 0,
            },
          });
        }
      }

      // ===============================
      // UPDATE STATUT
      // ===============================
      return tx.commande.update({
        where: { id },
        data: { statutCommande },
      });
    });
  }

  async getCommandes(
    compteId: string,
    statut?: StatutCommande,
  ) {
    return this.prisma.commande.findMany({
      where: {
        compteId,
        ...(statut && { statutCommande: statut }),
      },
      include: {
        lignes: {
          include: {
            produit: true,
          },
        },
        paiements: true,
      },
      orderBy: {
        creeLe: 'desc',
      },
    });
  }
}