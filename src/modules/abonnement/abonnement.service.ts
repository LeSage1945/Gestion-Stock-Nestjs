import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AbonnementService {
  constructor(private prisma: PrismaService) { }

  // ================= CHECK =================
  async checkCompteActif(compteId: string) {
    const abo = await this.prisma.abonnement.findUnique({
      where: { compteId },
    });

    if (!abo || abo.statut !== 'ACTIF') {
      throw new BadRequestException('Compte bloqué');
    }

    if (abo.fin && new Date() > abo.fin) {
      throw new BadRequestException('Abonnement expiré');
    }

    return true;
  }

  // ================= ACTIVER =================
  // async activerAbonnement(compteId: string, dureeJours: number) {

  //   const now = new Date();

  //   const fin = new Date();
  //   fin.setDate(fin.getDate() + dureeJours);

  //   return this.prisma.abonnement.upsert({
  //     where: { compteId },
  //     update: {
  //       statut: 'ACTIF',
  //       debut: now,
  //       fin: fin,
  //     },
  //     create: {
  //       compteId,
  //       statut: 'ACTIF',
  //       debut: now,
  //       fin: fin,
  //     }
  //   });
  // }

  activerAbonnement(compteId: string, dureeJours: number) {
    const now = new Date();

    const fin = new Date();
    fin.setDate(fin.getDate() + dureeJours);

    return this.prisma.abonnement.upsert({
      where: { compteId },
      update: { statut: 'ACTIF', debut: now, fin },
      create: { compteId, statut: 'ACTIF', debut: now, fin },
    });
  }

  // ================= DÉSACTIVER =================
  async desactiverAbonnement(compteId: string) {
    // Vérifier si l'abonnement existe d'abord
    const abo = await this.prisma.abonnement.findUnique({
      where: { compteId },
    });

    if (!abo) {
      throw new BadRequestException("Aucun abonnement trouvé pour ce compte");
    }

    // Mise à jour du statut à INACTIF
    return this.prisma.abonnement.update({
      where: { compteId },
      data: {
        statut: 'INACTIF',
        fin: new Date() // Optionnel : coupe l'abonnement immédiatement à l'instant T
      },
    });
  }

  // ================= STATUS =================
  async getStatus(compteId: string) {
    const abo = await this.prisma.abonnement.findFirst({
      where: { compteId },
    });

    if (!abo) {
      return {
        actif: false,
        message: 'Aucun abonnement trouvé',
      };
    }

    const isExpired = abo.fin ? new Date() > abo.fin : false;

    return {
      actif: abo.statut === 'ACTIF' && !isExpired,
      statut: abo.statut,
      debut: abo.debut,
      fin: abo.fin,
    };
  }

  async getAllAbonnements() {
    const abonnements = await this.prisma.abonnement.findMany({
      include: {
        compte: true, // si relation existe
      },
      orderBy: {
        debut: 'desc',
      },
    });

    return abonnements.map((abo) => {
      const isExpired = abo.fin ? new Date() > abo.fin : false;

      return {
        id: abo.id,
        compteId: abo.compteId,
        statut: abo.statut,
        debut: abo.debut,
        fin: abo.fin,
        actif: abo.statut === 'ACTIF' && !isExpired,
        compte: abo.compte,
      };
    });
  }
}