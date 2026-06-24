import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProduitService {
  constructor(private prismaService: PrismaService) { }

  // ======================
  // CREATE PRODUIT (SAAS)
  // ======================
  async createProduit(
    createProduitDto: CreateProduitDto,
    compteId: string,
  ) {
    const { nom, marque, prix, seuilAlerte } = createProduitDto;

    const existingProduit = await this.prismaService.produit.findFirst({
      where: {
        nom,
        marque,
        compteId, // 🔥 IMPORTANT SAAS
      },
    });

    if (existingProduit) {
      throw new BadRequestException('Ce produit existe déjà dans ce compte');
    }

    try {
      return await this.prismaService.produit.create({
        data: {
          nom,
          marque,
          prix,
          seuilAlerte,
          compteId, // 🔥 IMPORTANT SAAS
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Erreur lors de la création');
    }
  }

  // ======================
  // GET ALL PRODUITS (PAR COMPTE)
  // ======================
  async findAll(compteId: string) {
    try {
      return await this.prismaService.produit.findMany({
        where: { compteId }, // 🔥 FILTRE SAAS
      });
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la récupération');
    }
  }

  // ======================
  // GET ONE PRODUIT
  // ======================
  async findOne(id: string, compteId: string) {
    return this.prismaService.produit.findFirst({
      where: {
        id,
        compteId, // 🔥 sécurité
      },
    });
  }

  // ======================
  // UPDATE PRODUIT
  // ======================
  async update(
    id: string,
    updateProduitDto: UpdateProduitDto,
    compteId: string,
  ) {
    const { nom, marque, prix, seuilAlerte } = updateProduitDto;

    const existingProduit = await this.prismaService.produit.findFirst({
      where: {
        id,
        compteId, // 🔥 sécurité SaaS
      },
    });

    if (!existingProduit) {
      throw new BadRequestException('Produit introuvable');
    }

    try {
      return await this.prismaService.produit.update({
        where: { id },
        data: {
          nom,
          marque,
          prix,
          seuilAlerte,
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Erreur lors de la mise à jour');
    }
  }

  // ======================
  // DELETE PRODUIT
  // ======================
  async remove(id: string, compteId: string) {
    const produit = await this.prismaService.produit.findFirst({
      where: { id, compteId },
      include: {
        _count: {
          select: {
            lignesVente: true,
            entreesStock: true,
            sortiesStock: true,
          }
        }
      }
    });

    if (!produit) {
      throw new BadRequestException('Produit non trouvé');
    }

    if (produit._count.lignesVente > 0) {
      throw new BadRequestException(
        `Impossible de supprimer "${produit.nom}" : ce produit est lié à ${produit._count.lignesVente} vente(s)`
      );
    }

    if (produit._count.entreesStock > 0 || produit._count.sortiesStock > 0) {
      throw new BadRequestException(
        `Impossible de supprimer "${produit.nom}" : ce produit a un historique de stock`
      );
    }

    try {
      await this.prismaService.produit.delete({
        where: { id },
      });

      return { message: `Produit "${produit.nom}" supprimé avec succès` };

    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new BadRequestException(
          `Impossible de supprimer "${produit.nom}" : il est utilisé dans d'autres données`
        );
      }
      throw new InternalServerErrorException('Erreur serveur');
    }
  }
}