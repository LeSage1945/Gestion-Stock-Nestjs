import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateBoutiqueDto } from '../boutique/dto/create-boutique.dto';
import { CreateCategorieDto } from '../marketplace/dto/create-categorie.dto';

@Injectable()
export class AdminMarketplaceService {
  constructor(private prisma: PrismaService) { }

  // ================= CATÉGORIES =================
  async createCategorie(dto: CreateCategorieDto) {
    const existe = await this.prisma.categorie.findUnique({ where: { nom: dto.nom } });
    if (existe) throw new BadRequestException('Cette catégorie existe déjà');

    return this.prisma.categorie.create({
      data: {
        nom: dto.nom,
        icone: dto.icone,
        ordre: dto.ordre ?? 0,
      },
    });
  }

  async getAllCategories() {
    return this.prisma.categorie.findMany({
      orderBy: { ordre: 'asc' },
      include: { _count: { select: { comptes: true } } },
    });
  }

  async updateCategorie(id: string, dto: Partial<CreateCategorieDto>) {
    const categorie = await this.prisma.categorie.findUnique({ where: { id } });
    if (!categorie) throw new NotFoundException('Catégorie introuvable');

    return this.prisma.categorie.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategorie(id: string) {
    const categorie = await this.prisma.categorie.findUnique({
      where: { id },
      include: { _count: { select: { comptes: true } } },
    });

    if (!categorie) throw new NotFoundException('Catégorie introuvable');

    if (categorie._count.comptes > 0) {
      throw new BadRequestException(
        'Impossible de supprimer : des boutiques utilisent cette catégorie'
      );
    }

    await this.prisma.categorie.delete({ where: { id } });
    return { message: 'Catégorie supprimée avec succès' };
  }

  // ================= BOUTIQUES (COMPTES) =================
  async createBoutique(dto: CreateBoutiqueDto) {
    const existe = await this.prisma.compte.findUnique({ where: { code: dto.code } });
    if (existe) throw new BadRequestException('Ce code boutique existe déjà');

    const motDePasseHash = await bcrypt.hash(dto.adminMotDePasse, 10);

    return this.prisma.$transaction(async (tx) => {
      const compte = await tx.compte.create({
        data: {
          code: dto.code,
          nom: dto.nom,
          categorieId: dto.categorieId,
          logoUrl: dto.logoUrl,
          description: dto.description,
          adresse: dto.adresse,
          ville: dto.ville,
          visibleMarketplace: false, // visible seulement après validation manuelle
        },
      });

      await tx.utilisateur.create({
        data: {
          nom: dto.adminNom,
          email: dto.adminEmail,
          motDePasse: motDePasseHash,
          role: 'ADMIN',
          compteId: compte.id,
        },
      });

      // Abonnement par défaut inactif
      await tx.abonnement.create({
        data: {
          compteId: compte.id,
          statut: 'INACTIF',
        },
      });

      return compte;
    });
  }

  async getAllBoutiques() {
    return this.prisma.compte.findMany({
      include: {
        categorie: true,
        abonnement: true,
        _count: { select: { produits: true, utilisateurs: true } },
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  async getBoutiqueById(id: string) {
    const compte = await this.prisma.compte.findUnique({
      where: { id },
      include: { categorie: true, abonnement: true, utilisateurs: true },
    });

    if (!compte) throw new NotFoundException('Boutique introuvable');
    return compte;
  }

  async updateBoutique(id: string, dto: Partial<CreateBoutiqueDto>) {
    const compte = await this.prisma.compte.findUnique({ where: { id } });
    if (!compte) throw new NotFoundException('Boutique introuvable');

    return this.prisma.compte.update({
      where: { id },
      data: {
        nom: dto.nom,
        categorieId: dto.categorieId,
        logoUrl: dto.logoUrl,
        description: dto.description,
        adresse: dto.adresse,
        ville: dto.ville,
      },
    });
  }

  // ================= ACTIVER/DÉSACTIVER VISIBILITÉ MARKETPLACE =================
  async toggleVisibiliteMarketplace(id: string) {
    const compte = await this.prisma.compte.findUnique({ where: { id } });
    if (!compte) throw new NotFoundException('Boutique introuvable');

    return this.prisma.compte.update({
      where: { id },
      data: { visibleMarketplace: !compte.visibleMarketplace },
    });
  }

  // async deleteBoutique(id: string) {
  //   const compte = await this.prisma.compte.findUnique({ where: { id } });
  //   if (!compte) throw new NotFoundException('Boutique introuvable');

  //   await this.prisma.compte.delete({ where: { id } });
  //   return { message: 'Boutique supprimée avec succès' };
  // }
  async deleteBoutique(id: string) {
    const compte = await this.prisma.compte.findUnique({
      where: { id },
    });

    if (!compte) {
      throw new NotFoundException('Boutique introuvable');
    }

    return this.prisma.$transaction(async (tx) => {
      // utilisateurs liés
      await tx.utilisateur.deleteMany({
        where: { compteId: id },
      });

      // abonnements liés
      await tx.abonnement.deleteMany({
        where: { compteId: id },
      });

      // suppression boutique
      await tx.compte.delete({
        where: { id },
      });

      return { message: 'Boutique supprimée avec succès' };
    });
  }
}