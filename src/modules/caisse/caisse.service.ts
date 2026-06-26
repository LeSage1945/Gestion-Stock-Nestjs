import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CaisseService {
  constructor(private prisma: PrismaService) { }

  // ================= SOLDE =================
  // async getSolde(compteId: string) {
  //   const entrees = await this.prisma.mouvementCaisse.aggregate({
  //     where: { compteId, type: 'ENTREE' },
  //     _sum: { montant: true },
  //   });

  //   const sorties = await this.prisma.mouvementCaisse.aggregate({
  //     where: { compteId, type: 'SORTIE' },
  //     _sum: { montant: true },
  //   });

  //   const totalEntrees = entrees._sum.montant || 0;
  //   const totalSorties = sorties._sum.montant || 0;

  //   return {
  //     solde: totalEntrees - totalSorties,
  //     totalEntrees,
  //     totalSorties,
  //   };
  // }

  // ================= GET ALL =================
  async getAll(compteId: string) {
    return this.prisma.mouvementCaisse.findMany({
      where: { compteId },
      orderBy: { creeLe: 'desc' },
    });
  }

  // ================= MOUVEMENT MANUEL =================
  async addManuel(compteId: string, dto: {
    type: 'ENTREE' | 'SORTIE';
    montant: number;
    motif: string;
  }) {
    if (dto.montant <= 0) {
      throw new BadRequestException('Le montant doit être positif');
    }

    if (!dto.motif?.trim()) {
      throw new BadRequestException('Le motif est obligatoire');
    }

    // Vérifier solde suffisant pour une sortie
    if (dto.type === 'SORTIE') {
      // const { solde } = await this.getSolde(compteId);
      const solde = await this.getSolde(compteId);
      if (solde < dto.montant) {
        throw new BadRequestException(
          `Solde insuffisant. Solde actuel : ${solde} FCFA`
        );
      }
    }

    return this.prisma.mouvementCaisse.create({
      data: {
        compteId,
        type: dto.type,
        source: 'MANUEL',
        montant: dto.montant,
        motif: dto.motif,
      },
    });
  }

  // ================= ENTREE AUTO (VENTE) =================
  async addEntreeVente(compteId: string, montant: number, venteId: string) {
    return this.prisma.mouvementCaisse.create({
      data: {
        compteId,
        type: 'ENTREE',
        source: 'VENTE',
        montant,
        motif: `Vente enregistrée`,
        venteId,
      },
    });
  }

  // ================= SORTIE AUTO (ACHAT STOCK) =================
  async addSortieAchat(compteId: string, montant: number, entreeStockId: string, produitNom: string) {
    return this.prisma.mouvementCaisse.create({
      data: {
        compteId,
        type: 'SORTIE',
        source: 'ACHAT_STOCK',
        montant,
        motif: `Achat stock : ${produitNom}`,
        entreeStockId,
      },
    });
  }

  // ================= DELETE =================
  async remove(id: string, compteId: string) {
    const mouvement = await this.prisma.mouvementCaisse.findFirst({
      where: { id, compteId },
    });

    if (!mouvement) {
      throw new BadRequestException('Mouvement introuvable');
    }

    if (mouvement.source !== 'MANUEL') {
      throw new BadRequestException(
        'Impossible de supprimer un mouvement automatique'
      );
    }

    await this.prisma.mouvementCaisse.delete({ where: { id } });
    return { message: 'Mouvement supprimé avec succès' };
  }

  // ================= SOLDE =================
  async getSolde(compteId: string): Promise<number> {
    const entrees = await this.prisma.mouvementCaisse.aggregate({
      where: { compteId, type: 'ENTREE' },
      _sum: { montant: true },
    });

    const sorties = await this.prisma.mouvementCaisse.aggregate({
      where: { compteId, type: 'SORTIE' },
      _sum: { montant: true },
    });

    return (entrees._sum.montant || 0) - (sorties._sum.montant || 0);
  }

  // ================= VÉRIFIER CAPITAL INITIAL =================
  async hasCapitalInitial(compteId: string): Promise<boolean> {
    const capital = await this.prisma.mouvementCaisse.findFirst({
      where: {
        compteId,
        type: 'ENTREE',
        source: 'MANUEL',
        motif: { contains: 'Capital initial' },
      },
    });
    return !!capital;
  }
}