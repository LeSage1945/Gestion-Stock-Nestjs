import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) { }

  // ================= CREATE =================
  async create(dto: CreateClientDto, compteId: string) {
    const existant = await this.prisma.client.findFirst({
      where: { compteId, telephone: dto.telephone },
    });

    if (existant) {
      throw new ConflictException(
        `Un client avec ce numéro existe déjà : ${existant.nom}`,
      );
    }

    return this.prisma.client.create({
      data: {
        compteId,
        nom: dto.nom,
        telephone: dto.telephone,
        adresse: dto.adresse,
        notes: dto.notes,
        limiteCredit: dto.limiteCredit,
      },
    });
  }

  // ================= FIND ALL (avec recherche optionnelle) =================
  async findAll(compteId: string, recherche?: string) {
    return this.prisma.client.findMany({
      where: {
        compteId,
        ...(recherche
          ? {
            OR: [
              { nom: { contains: recherche } },
              { telephone: { contains: recherche } },
            ],
          }
          : {}),
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  // ================= FIND ONE (avec historique ventes + dettes) =================
  async findOne(id: string, compteId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, compteId },
      include: {
        ventes: {
          orderBy: { creeLe: 'desc' },
          include: { lignes: { include: { produit: true } } },
        },
        dettes: {
          orderBy: { creeLe: 'desc' },
          include: { remboursements: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    return client;
  }

  // ================= RECHERCHE PAR TELEPHONE (utile pour le POS) =================
  async findByTelephone(telephone: string, compteId: string) {
    return this.prisma.client.findFirst({
      where: { compteId, telephone },
    });
  }

  // ================= UPDATE =================
  async update(id: string, dto: UpdateClientDto, compteId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, compteId },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    if (dto.telephone && dto.telephone !== client.telephone) {
      const conflit = await this.prisma.client.findFirst({
        where: { compteId, telephone: dto.telephone, id: { not: id } },
      });
      if (conflit) {
        throw new ConflictException(
          `Un autre client utilise déjà ce numéro : ${conflit.nom}`,
        );
      }
    }

    return this.prisma.client.update({
      where: { id },
      data: {
        nom: dto.nom ?? client.nom,
        telephone: dto.telephone ?? client.telephone,
        adresse: dto.adresse ?? client.adresse,
        notes: dto.notes ?? client.notes,
        limiteCredit: dto.limiteCredit ?? client.limiteCredit,
      },
    });
  }

  // ================= DELETE =================
  async remove(id: string, compteId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, compteId },
      include: { dettes: { where: { statut: 'EN_COURS' } } },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    if (client.dettes.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer ce client : il a encore des dettes en cours',
      );
    }

    await this.prisma.client.delete({ where: { id } });

    return { message: 'Client supprimé avec succès' };
  }
}