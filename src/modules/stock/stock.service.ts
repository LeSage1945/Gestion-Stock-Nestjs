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
    const { produitId, fournisseurId, quantite, prixAchat } = dto;

    console.log('DTO reçu pour entrée stock :', dto);
    console.log('compteId admin connecté :', compteId);

    const produit = await this.prismaService.produit.findFirst({
      where: { id: produitId, compteId },
    });

    console.log('Produit trouvé :', produit);

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

      await this.generateAlertes(compteId);

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

      await this.generateAlertes(compteId);

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

    const ventes = await this.prismaService.ligneVente.aggregate({
      where: { produitId },
      _sum: { quantite: true },
    });

    const stockActuel =
      (entrees._sum.quantite || 0) -
      (sorties._sum.quantite || 0) -
      (ventes._sum.quantite || 0);

    return {
      produitId,
      stockActuel,
      entrees: entrees._sum.quantite || 0,
      sorties: sorties._sum.quantite || 0,
    };
  }

  // ======================
  // ALERTES STOCK (SAAS)
  // ======================
  async generateAlertes(compteId: string) {
    const produits = await this.prismaService.produit.findMany({
      where: { compteId }, // 🔥 IMPORTANT SAAS
    });

    for (const p of produits) {
      const stock = await this.getStockByProduit(p.id, compteId);

      await this.prismaService.alerteStock.upsert({
        where: { produitId: p.id },
        update: {
          quantiteActuelle: stock.stockActuel,
          niveauAlerte: p.seuilAlerte,
        },
        create: {
          produitId: p.id,
          quantiteActuelle: stock.stockActuel,
          niveauAlerte: p.seuilAlerte,
        },
      });
    }
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

    await this.prismaService.entreeStock.delete({
      where: { id },
    });

    await this.generateAlertes(compteId);

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

    await this.prismaService.sortieStock.delete({
      where: { id },
    });

    await this.generateAlertes(compteId);

    return { message: 'Sortie supprimée avec succès' };
  }

  // ======================
  // ALL STOCKS (SAAS)
  // ======================
  async getAllStocks(compteId: string) {
    const produits = await this.prismaService.produit.findMany({
      where: { compteId },
      include: {
        entreesStock: true,
        sortiesStock: true,
        lignesVente: true,
      },
    });

    return produits.map((p) => {
      const totalEntrees = p.entreesStock.reduce(
        (sum, e) => sum + e.quantite,
        0,
      );

      const totalSorties = p.sortiesStock.reduce(
        (sum, s) => sum + s.quantite,
        0,
      );

      const totalVentes = p.lignesVente.reduce(
        (sum, v) => sum + v.quantite,
        0,
      );

      return {
        produitId: p.id,
        nom: p.nom,
        marque: p.marque,
        seuilAlerte: p.seuilAlerte,
        entrees: totalEntrees,
        sorties: totalSorties,
        ventes: totalVentes,
        stockActuel: totalEntrees - totalSorties - totalVentes,
      };
    });
  }
}