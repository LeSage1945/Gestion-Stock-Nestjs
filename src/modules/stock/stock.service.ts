import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEntreeStockDto } from './dto/create-stock.dto';
import { CreateSortieStockDto } from './dto/createSortie-stock.dto';

@Injectable()
export class StockService {
  constructor(private prismaService: PrismaService) { }

  // ======================
  // ENTREE STOCK
  // ======================
  async addEntree(
    dto: CreateEntreeStockDto,
    compteId: string,
  ) {
    const { produitId, quantite, prixAchat } = dto;

    // Si fournisseurId est une chaîne vide ou absent, on le transforme en undefined
    const fournisseurId = dto.fournisseurId && dto.fournisseurId.trim() !== ''
      ? dto.fournisseurId
      : undefined;

    const produit = await this.prismaService.produit.findFirst({
      where: { id: produitId, compteId },
    });

    if (!produit) {
      throw new BadRequestException('Produit introuvable');
    }

    try {
      const entree = await this.prismaService.entreeStock.create({
        data: {
          produitId,
          fournisseurId,
          quantite,
          prixAchat,
        },
      });

      // 🔥 CORRECTION : Alerte ciblée sur le produit modifié
      await this.generateAlertePourProduit(produitId, compteId);

      return entree;
    } catch (error) {
      console.error('ERREUR REELLE AJOUT STOCK :', error);
      throw new InternalServerErrorException(
        "Erreur lors de l'ajout du stock",
      );
    }
  }

  // ======================
  // SORTIE STOCK
  // ======================
  async addSortie(
    dto: CreateSortieStockDto,
    compteId: string,
  ) {
    const { produitId, quantite, raison } = dto;

    const stock = await this.getStockByProduit(produitId, compteId);

    if (stock.stockActuel < quantite) {
      throw new BadRequestException('Stock insuffisant');
    }

    const produit = await this.prismaService.produit.findFirst({
      where: { id: produitId, compteId },
    });

    if (!produit) {
      throw new BadRequestException('Produit introuvable');
    }

    try {
      const sortie = await this.prismaService.sortieStock.create({
        data: {
          produitId,
          quantite,
          raison,
        },
      });

      // 🔥 CORRECTION : Alerte ciblée sur le produit modifié
      await this.generateAlertePourProduit(produitId, compteId);

      return sortie;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erreur lors de la sortie de stock',
      );
    }
  }

  // ======================
  // STOCK PAR PRODUIT
  // ======================
  async getStockByProduit(produitId: string, compteId: string) {
    const produit = await this.prismaService.produit.findFirst({
      where: { id: produitId, compteId },
    });

    if (!produit) {
      throw new BadRequestException('Produit introuvable');
    }

    const entrees = await this.prismaService.entreeStock.aggregate({
      where: { produitId },
      _sum: { quantite: true },
    });

    const sorties = await this.prismaService.sortieStock.aggregate({
      where: { produitId },
      _sum: { quantite: true },
    });

    // const ventes = await this.prismaService.ligneVente.aggregate({
    //   where: { produitId },
    //   _sum: { quantite: true },
    // });

    const stockActuel = (entrees._sum.quantite || 0) - (sorties._sum.quantite || 0);
    // (ventes._sum.quantite || 0);

    return {
      produitId,
      stockActuel,
      entrees: entrees._sum.quantite || 0,
      sorties: sorties._sum.quantite || 0,
    };
  }

  // ======================
  // ALERTES STOCK OPTIMISÉE (SAAS)
  // ======================
  async generateAlertePourProduit(produitId: string, compteId: string) {
    const stock = await this.getStockByProduit(produitId, compteId);

    const produit = await this.prismaService.produit.findFirst({
      where: { id: produitId, compteId }
    });

    if (!produit) return;

    await this.prismaService.alerteStock.upsert({
      where: { produitId: produitId },
      update: {
        quantiteActuelle: stock.stockActuel,
        niveauAlerte: produit.seuilAlerte,
      },
      create: {
        produitId: produitId,
        quantiteActuelle: stock.stockActuel,
        niveauAlerte: produit.seuilAlerte,
      },
    });
  }

  // ======================
  // LISTES (SAAS)
  // ======================
  async findAllEntrees(compteId: string) {
    return this.prismaService.entreeStock.findMany({
      where: {
        produit: {
          compteId,
        },
      },
      include: {
        produit: true,
        fournisseur: true,
      },
    });
  }

  async findAllSorties(compteId: string) {
    return this.prismaService.sortieStock.findMany({
      where: {
        produit: {
          compteId,
        },
      },
      include: {
        produit: true,
      },
    });
  }

  // ======================
  // DELETE ENTREE
  // ======================
  async removeEntree(id: string, compteId: string) {
    const entree = await this.prismaService.entreeStock.findFirst({
      where: {
        id,
        produit: {
          compteId,
        },
      },
    });

    if (!entree) {
      throw new BadRequestException('Entrée introuvable');
    }

    const produitId = entree.produitId;

    await this.prismaService.entreeStock.delete({
      where: { id },
    });

    // 🔥 CORRECTION : Alerte ciblée après suppression
    await this.generateAlertePourProduit(produitId, compteId);

    return { message: 'Entrée supprimée avec succès' };
  }

  // ======================
  // DELETE SORTIE
  // ======================
  async removeSortie(id: string, compteId: string) {
    const sortie = await this.prismaService.sortieStock.findFirst({
      where: {
        id,
        produit: {
          compteId,
        },
      },
    });

    if (!sortie) {
      throw new BadRequestException('Sortie introuvable');
    }

    const produitId = sortie.produitId;

    await this.prismaService.sortieStock.delete({
      where: { id },
    });

    // 🔥 CORRECTION : Alerte ciblée après suppression
    await this.generateAlertePourProduit(produitId, compteId);

    return { message: 'Sortie supprimée avec succès' };
  }

  // ======================
  // ALL STOCKS (SAAS)
  // ======================
  // async getAllStocks(compteId: string) {
  //   const produits = await this.prismaService.produit.findMany({
  //     where: { compteId },
  //     include: {
  //       entreesStock: true,
  //       sortiesStock: true,
  //       lignesVente: true,
  //     },
  //   });

  //   return produits.map((p) => {
  //     const totalEntrees = p.entreesStock.reduce(
  //       (sum, e) => sum + e.quantite,
  //       0,
  //     );

  //     const totalSorties = p.sortiesStock.reduce(
  //       (sum, s) => sum + s.quantite,
  //       0,
  //     );

  //     // const totalVentes = p.lignesVente.reduce(
  //     //   (sum, v) => sum + v.quantite,
  //     //   0,
  //     // );

  //     return {
  //       produitId: p.id,
  //       nom: p.nom,
  //       marque: p.marque,
  //       seuilAlerte: p.seuilAlerte,
  //       entrees: totalEntrees,
  //       sorties: totalSorties,
  //       ventes: totalVentes,
  //       stockActuel: totalEntrees - totalSorties - totalVentes,
  //     };
  //   });
  // }

  async getAllStocks(compteId: string) {
    const produits = await this.prismaService.produit.findMany({
      where: { compteId },
      include: {
        entreesStock: true,
        sortiesStock: true,
        lignesVente: true, // ← pour calculer le réalisé
      },
    });

    return produits.map((p) => {
      const totalEntrees = p.entreesStock.reduce((sum, e) => sum + e.quantite, 0);
      const totalSorties = p.sortiesStock.reduce((sum, s) => sum + s.quantite, 0);

      // Total attendu = tout le stock entré × prix de vente
      const totalAttendu = totalEntrees * p.prix;

      // Réalisé = ce qui a été vendu × prix de vente
      const totalRealise = p.lignesVente.reduce(
        (sum, v) => sum + v.quantite * v.prix, 0
      );

      // Manque à gagner
      const manqueAGagner = totalAttendu - totalRealise;

      return {
        produitId: p.id,
        nom: p.nom,
        marque: p.marque,
        prix: p.prix,
        seuilAlerte: p.seuilAlerte,
        entrees: totalEntrees,
        sorties: totalSorties,
        stockActuel: totalEntrees - totalSorties,
        totalAttendu,
        totalRealise,
        manqueAGagner,
      };
    });
  }
}