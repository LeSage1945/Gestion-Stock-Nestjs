import { Injectable, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockService } from '../stock/stock.service';

@Injectable()
export class CaisseService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => StockService))
    private stockService: StockService,
  ) { }

  // ================= SOLDE =================
  async getSolde(compteId: string): Promise<{ solde: number; totalEntrees: number; totalSorties: number }> {
    const entrees = await this.prisma.mouvementCaisse.aggregate({
      where: { compteId, type: 'ENTREE' },
      _sum: { montant: true },
    });

    const sorties = await this.prisma.mouvementCaisse.aggregate({
      where: { compteId, type: 'SORTIE' },
      _sum: { montant: true },
    });

    const totalEntrees = entrees._sum.montant || 0;
    const totalSorties = sorties._sum.montant || 0;

    return {
      solde: totalEntrees - totalSorties,
      totalEntrees,
      totalSorties,
    };
  }

  // ================= CAPITAL INITIAL =================
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
    if (dto.montant <= 0)
      throw new BadRequestException('Le montant doit être positif');

    if (!dto.motif?.trim())
      throw new BadRequestException('Le motif est obligatoire');

    if (dto.type === 'SORTIE') {
      const { solde } = await this.getSolde(compteId);
      if (solde < dto.montant)
        throw new BadRequestException(`Solde insuffisant. Solde actuel : ${solde.toLocaleString('fr-FR')} FCFA`);
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

  // ================= UPDATE MOUVEMENT =================
  async update(id: string, compteId: string, dto: {
    montant?: number;
    motif?: string;
  }) {
    const mouvement = await this.prisma.mouvementCaisse.findFirst({
      where: { id, compteId },
    });

    if (!mouvement)
      throw new BadRequestException('Mouvement introuvable');

    if (dto.montant !== undefined && dto.montant <= 0)
      throw new BadRequestException('Le montant doit être positif');

    if (dto.motif !== undefined && !dto.motif.trim())
      throw new BadRequestException('Le motif ne peut pas être vide');

    if (dto.montant !== undefined && mouvement.type === 'SORTIE') {
      const { solde: soldeActuel } = await this.getSolde(compteId);
      const soldeCorrige = soldeActuel + mouvement.montant;
      if (soldeCorrige < dto.montant)
        throw new BadRequestException(
          `Solde insuffisant pour cette correction. Disponible : ${soldeCorrige.toLocaleString('fr-FR')} FCFA`
        );
    }

    return this.prisma.mouvementCaisse.update({
      where: { id },
      data: {
        ...(dto.montant !== undefined && { montant: dto.montant }),
        ...(dto.motif !== undefined && { motif: dto.motif }),
      },
    });
  }

  // ================= DELETE =================
  async remove(id: string, compteId: string) {
    const mouvement = await this.prisma.mouvementCaisse.findFirst({
      where: { id, compteId },
    });

    if (!mouvement) throw new BadRequestException('Mouvement introuvable');

    if (mouvement.source === 'ACHAT_STOCK' && mouvement.entreeStockId) {
      const entree = await this.prisma.entreeStock.findFirst({
        where: { id: mouvement.entreeStockId },
      });

      await this.prisma.mouvementCaisse.delete({ where: { id } });

      await this.prisma.entreeStock.delete({
        where: { id: mouvement.entreeStockId },
      });

      if (entree) {
        await this.stockService.generateAlertePourProduit(entree.produitId, compteId);
      }
    }

    if (mouvement.source === 'VENTE' && mouvement.venteId) {
      const dette = await this.prisma.dette.findFirst({
        where: { venteId: mouvement.venteId },
        include: { client: true },
      });

      if (dette && dette.statut === 'EN_COURS') {
        throw new BadRequestException(
          `Impossible de supprimer cette vente : une dette de ${dette.montantRestant.toLocaleString('fr-FR')} FCFA ` +
          `est encore en cours pour ${dette.client.nom}. ` +
          `Pour corriger une erreur de saisie, allez sur la page Dettes et utilisez "Annuler la dette".`,
        );
      }

      const lignes = await this.prisma.ligneVente.findMany({
        where: { venteId: mouvement.venteId },
      });

      const operations: any[] = [];

      if (dette) {
        operations.push(
          this.prisma.remboursementDette.deleteMany({ where: { detteId: dette.id } }),
        );
        operations.push(
          this.prisma.dette.delete({ where: { id: dette.id } }),
        );
      }

      operations.push(
        this.prisma.sortieStock.deleteMany({ where: { venteId: mouvement.venteId! } }),
      );
      operations.push(
        this.prisma.ligneVente.deleteMany({ where: { venteId: mouvement.venteId! } }),
      );
      operations.push(
        this.prisma.paiement.deleteMany({ where: { venteId: mouvement.venteId! } }),
      );
      operations.push(
        this.prisma.mouvementCaisse.delete({ where: { id } }),
      );
      operations.push(
        this.prisma.vente.delete({ where: { id: mouvement.venteId! } }),
      );

      await this.prisma.$transaction(operations);

      for (const ligne of lignes) {
        await this.stockService.generateAlertePourProduit(ligne.produitId, compteId);
      }
    }

    if (mouvement.source === 'MANUEL') {
      await this.prisma.mouvementCaisse.delete({ where: { id } });
    }

    if (mouvement.source === 'DETTE') {
      throw new BadRequestException(
        'Ce mouvement correspond à un remboursement de dette et ne peut pas être supprimé directement.',
      );
    }

    return { message: 'Mouvement supprimé avec succès' };
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
}