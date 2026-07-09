import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRemboursementDto } from './dto/create-dette.dto';
import { CreateDetteManuelleDto } from './dto/create-dette-manuelle.dto';

@Injectable()
export class DetteService {
  constructor(private prisma: PrismaService) { }

  // ================= LISTE DES DETTES (avec filtre statut optionnel) =================
  async findAll(compteId: string, statut?: 'EN_COURS' | 'SOLDEE') {
    return this.prisma.dette.findMany({
      where: {
        compteId,
        ...(statut ? { statut } : {}),
      },
      include: {
        client: true,
        vente: {
          include: {
            lignes: { include: { produit: true } },
          },
        },
        remboursements: {
          orderBy: { creeLe: 'desc' },
        },
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  // ================= DETTES EN COURS UNIQUEMENT (raccourci) =================
  async findEnCours(compteId: string) {
    return this.findAll(compteId, 'EN_COURS');
  }

  // ================= DÉTAIL D'UNE DETTE =================
  async findOne(id: string, compteId: string) {
    const dette = await this.prisma.dette.findFirst({
      where: { id, compteId },
      include: {
        client: true,
        vente: {
          include: {
            lignes: { include: { produit: true } },
          },
        },
        remboursements: {
          orderBy: { creeLe: 'desc' },
        },
      },
    });

    if (!dette) {
      throw new NotFoundException('Dette introuvable');
    }

    return dette;
  }

  // ================= TOTAL DES DETTES EN COURS (pour les stats) =================
  async getTotalEnCours(compteId: string) {
    const result = await this.prisma.dette.aggregate({
      where: { compteId, statut: 'EN_COURS' },
      _sum: { montantRestant: true },
      _count: true,
    });

    return {
      totalMontant: result._sum.montantRestant || 0,
      totalDettes: result._count,
    };
  }

  // ================= REMBOURSEMENT =================
  async rembourser(detteId: string, dto: CreateRemboursementDto, compteId: string) {
    const dette = await this.prisma.dette.findFirst({
      where: { id: detteId, compteId },
    });

    if (!dette) {
      throw new NotFoundException('Dette introuvable');
    }

    if (dette.statut === 'SOLDEE') {
      throw new BadRequestException('Cette dette est déjà soldée');
    }

    if (dto.montant > dette.montantRestant) {
      throw new BadRequestException(
        `Le montant dépasse le solde restant (${dette.montantRestant.toLocaleString('fr-FR')} FCFA)`,
      );
    }

    const nouveauRestant = dette.montantRestant - dto.montant;
    const nouveauStatut = nouveauRestant <= 0 ? 'SOLDEE' : 'EN_COURS';
    const remboursementId = randomUUID(); // généré à l'avance pour pouvoir le référencer dans le même lot

    const [detteMaj, remboursement] = await this.prisma.$transaction([
      this.prisma.dette.update({
        where: { id: detteId },
        data: {
          montantRestant: nouveauRestant,
          statut: nouveauStatut,
        },
      }),
      this.prisma.remboursementDette.create({
        data: {
          id: remboursementId,
          detteId,
          montant: dto.montant,
          methodePaiement: dto.methodePaiement,
          motif: dto.motif,
        },
      }),
      this.prisma.mouvementCaisse.create({
        data: {
          compteId,
          type: 'ENTREE',
          source: 'DETTE',
          montant: dto.montant,
          motif: dto.motif || `Remboursement de dette`,
          remboursementId,
        },
      }),
    ]);

    return { dette: detteMaj, remboursement };
  }

  // ================= ANNULER UNE DETTE ENTIÈRE (erreur de saisie à la vente) =================
  async annulerDette(detteId: string, compteId: string) {
    const dette = await this.prisma.dette.findFirst({
      where: { id: detteId, compteId },
      include: { remboursements: true },
    });

    if (!dette) {
      throw new NotFoundException('Dette introuvable');
    }

    const remboursementIds = dette.remboursements.map(r => r.id);

    const operations: any[] = [];

    if (remboursementIds.length > 0) {
      operations.push(
        this.prisma.mouvementCaisse.deleteMany({
          where: { remboursementId: { in: remboursementIds } },
        }),
      );
    }

    operations.push(
      this.prisma.remboursementDette.deleteMany({ where: { detteId } }),
    );
    operations.push(
      this.prisma.dette.delete({ where: { id: detteId } }),
    );

    await this.prisma.$transaction(operations);

    return { message: 'Dette annulée avec succès' };
  }

  // ================= ANNULER UN REMBOURSEMENT (erreur de saisie) =================
  async annulerRemboursement(remboursementId: string, compteId: string) {
    const remboursement = await this.prisma.remboursementDette.findFirst({
      where: { id: remboursementId },
      include: { dette: true },
    });

    if (!remboursement || remboursement.dette.compteId !== compteId) {
      throw new NotFoundException('Remboursement introuvable');
    }

    const dette = remboursement.dette;
    const nouveauRestant = Math.min(
      dette.montantRestant + remboursement.montant,
      dette.montantInitial,
    );

    const [detteMaj] = await this.prisma.$transaction([
      this.prisma.dette.update({
        where: { id: dette.id },
        data: {
          montantRestant: nouveauRestant,
          statut: 'EN_COURS',
        },
      }),
      this.prisma.mouvementCaisse.deleteMany({
        where: { remboursementId: remboursement.id },
      }),
      this.prisma.remboursementDette.delete({
        where: { id: remboursementId },
      }),
    ]);

    return { dette: detteMaj, message: 'Remboursement annulé avec succès' };
  }

  // ================= CRÉER UNE DETTE MANUELLE (sans vente, ex: ancienne dette) =================
  async creerDetteManuelle(dto: CreateDetteManuelleDto, compteId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, compteId },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    if (dto.montant <= 0) {
      throw new BadRequestException('Le montant doit être supérieur à 0');
    }

    // Vérifier la limite de crédit du client, si définie
    if (client.limiteCredit !== null) {
      const totalEnCours = await this.prisma.dette.aggregate({
        where: { clientId: dto.clientId, compteId, statut: 'EN_COURS' },
        _sum: { montantRestant: true },
      });

      const montantActuel = totalEnCours._sum.montantRestant || 0;

      if (montantActuel + dto.montant > client.limiteCredit) {
        throw new BadRequestException(
          `Cette dette dépasserait la limite de crédit du client (${client.limiteCredit.toLocaleString('fr-FR')} FCFA)`,
        );
      }
    }

    const dette = await this.prisma.dette.create({
      data: {
        compteId,
        clientId: dto.clientId,
        source: 'MANUELLE',
        montantInitial: dto.montant,
        montantRestant: dto.montant,
      },
      include: {
        client: true,
      },
    });

    return dette;
  }
}