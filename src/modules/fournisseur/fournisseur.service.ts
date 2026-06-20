import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FournisseurService {
  constructor(private prismaService: PrismaService) { }

  // ================= CREATE =================
  async create(dto: CreateFournisseurDto, compteId: string) {
    const { nom, telephone, adresse } = dto;

    const compteExiste = await this.prismaService.compte.findUnique({
      where: { id: compteId },
    });

    if (!compteExiste) {
      throw new BadRequestException('Compte introuvable, veuillez vous reconnecter');
    }

    try {
      return await this.prismaService.fournisseur.create({
        data: {
          nom,
          telephone: telephone ?? null,
          adresse: adresse ?? null,
          compte: {
            connect: { id: compteId },
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Erreur serveur');
    }
  }

  // ================= FIND ALL =================
  async findAll() {
    try {
      return await this.prismaService.fournisseur.findMany({
        orderBy: { creeLe: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erreur serveur');
    }
  }

  // ================= FIND ONE =================
  async findOne(id: string) {
    const fournisseur = await this.prismaService.fournisseur.findUnique({
      where: { id },
    });

    if (!fournisseur) {
      throw new NotFoundException('Fournisseur introuvable');
    }

    return fournisseur;
  }

  // ================= UPDATE =================
  async update(id: string, dto: UpdateFournisseurDto) {
    const existing = await this.prismaService.fournisseur.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Fournisseur introuvable');
    }

    return this.prismaService.fournisseur.update({
      where: { id },
      data: {
        nom: dto.nom,
        telephone: dto.telephone ?? null,
        adresse: dto.adresse ?? null,
      },
    });
  }

  // ================= DELETE =================
  async remove(id: string) {
    try {
      const existing = await this.prismaService.fournisseur.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Fournisseur introuvable');
      }

      await this.prismaService.fournisseur.delete({
        where: { id },
      });

      return { message: 'Fournisseur supprimé avec succès' };
    } catch (error: any) {
      console.log(error);

      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Impossible de supprimer : fournisseur utilisé',
        );
      }

      throw new InternalServerErrorException('Erreur serveur');
    }
  }
}