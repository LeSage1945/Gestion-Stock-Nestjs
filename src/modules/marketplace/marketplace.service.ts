import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) { }

  // ================= LISTE CATÉGORIES =================
  async getCategories() {
    return this.prisma.categorie.findMany({
      orderBy: { ordre: 'asc' },
      include: {
        _count: {
          select: {
            comptes: { where: { visibleMarketplace: true } },
          },
        },
      },
    });
  }

  // ================= BOUTIQUES D'UNE CATÉGORIE =================
  async getBoutiquesByCategorie(categorieId: string) {
    return this.prisma.compte.findMany({
      where: { categorieId, visibleMarketplace: true },
      select: {
        id: true,
        nom: true,
        logoUrl: true,
        description: true,
        adresse: true,
        ville: true,
      },
    });
  }

  // ================= DÉTAIL BOUTIQUE =================
  async getBoutiqueDetail(compteId: string) {
    const boutique = await this.prisma.compte.findFirst({
      where: { id: compteId, visibleMarketplace: true },
      select: {
        id: true,
        nom: true,
        logoUrl: true,
        description: true,
        adresse: true,
        ville: true,
        categorie: { select: { nom: true } },
      },
    });

    if (!boutique) throw new NotFoundException('Boutique introuvable');
    return boutique;
  }

  // ================= PRODUITS D'UNE BOUTIQUE =================
  async getProduitsBoutique(compteId: string) {
    const produits = await this.prisma.produit.findMany({
      where: { compteId, visibleBoutique: true },
      include: { entreesStock: true, sortiesStock: true },
    });

    return produits
      .map((p) => {
        const totalEntrees = p.entreesStock.reduce((s, e) => s + e.quantite, 0);
        const totalSorties = p.sortiesStock.reduce((s, e) => s + e.quantite, 0);
        return {
          id: p.id,
          nom: p.nom,
          marque: p.marque,
          prix: p.prix,
          imageUrl: p.imageUrl,
          description: p.description,
          stockActuel: totalEntrees - totalSorties,
        };
      })
      .filter((p) => p.stockActuel > 0);
  }
}