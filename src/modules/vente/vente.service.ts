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
    const { lignes, paiements, utilisateurId, montantTotal } = dto;

    if (!lignes?.length) {
      throw new BadRequestException('Aucun produit dans la vente');
    }

    // ================= VALIDATION TOTAL =================
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

    const totalPaiements = paiements.reduce(
      (sum, p) => sum + p.montant,
      0,
    );

    if (totalPaiements !== montantTotal) {
      throw new BadRequestException('Paiements incorrects');
    }

    return this.prisma.$transaction(async (tx) => {
      // ================= STOCK CHECK SAAS =================
      // for (const l of lignes) {
      //   const produit = await tx.produit.findFirst({
      //     where: {
      //       id: l.produitId,
      //       compteId, // 🔥 SAAS SECURITY
      //     },
      //   });

      //   if (!produit) {
      //     throw new BadRequestException('Produit introuvable');
      //   }

      //   const entrees = await tx.entreeStock.aggregate({
      //     where: { produitId: l.produitId },
      //     _sum: { quantite: true },
      //   });

      //   const sorties = await tx.sortieStock.aggregate({
      //     where: { produitId: l.produitId },
      //     _sum: { quantite: true },
      //   });

      //   const ventes = await tx.ligneVente.aggregate({
      //     where: { produitId: l.produitId },
      //     _sum: { quantite: true },
      //   });

      //   const stock =
      //     (entrees._sum.quantite || 0) -
      //     (sorties._sum.quantite || 0) -
      //     (ventes._sum.quantite || 0);

      //   if (stock < l.quantite) {
      //     throw new BadRequestException(
      //       `Stock insuffisant pour ${produit.nom}`,
      //     );
      //   }
      // }
      for (const l of lignes) {
        const produit = await tx.produit.findFirst({
          where: {
            id: l.produitId,
            compteId,
          },
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
          compteId, // 🔥 IMPORTANT SAAS
          montantTotal,
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
          },
        });
      }

      // ================= PAIEMENTS =================
      for (const p of paiements) {
        await tx.paiement.create({
          data: {
            venteId: vente.id,
            montant: p.montant,
            methodePaiement: p.methodePaiement,
          },
        });
      }

      return vente;
    }, {
      timeout: 15000, // 🔥 15 secondes au lieu de 5 par défaut (évite P2028 sur bases distantes)
    });
  }

  // ================= FIND ALL (SAAS) =================
  async findAll(compteId: string) {
    return this.prisma.vente.findMany({
      where: { compteId }, // 🔥 SAAS FILTER
      include: {
        utilisateur: true,
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

  // ================= FIND ONE =================
  async findOne(id: string, compteId: string) {
    const vente = await this.prisma.vente.findFirst({
      where: {
        id,
        compteId,
      },
      include: {
        utilisateur: true,
        lignes: {
          include: {
            produit: true,
          },
        },
        paiements: true,
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
    });

    if (!vente) {
      throw new NotFoundException('Vente introuvable');
    }

    return this.prisma.$transaction(async (tx) => {
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