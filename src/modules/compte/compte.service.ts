import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompteService {

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  // ================= CREATE =================

  async create(
    createCompteDto: CreateCompteDto,
  ) {

    const compteExiste =
      await this.prisma.compte.findUnique({
        where: {
          code: createCompteDto.code,
        },
      });

    if (compteExiste) {

      throw new BadRequestException(
        'Un compte avec ce code existe déjà.',
      );

    }

    const compte =
      await this.prisma.compte.create({
        data: createCompteDto,
      });

    return {
      message: 'Compte créé avec succès ✅',
      data: compte,
    };
  }

  // ================= GET ALL =================

  async findAll() {

    const comptes =
      await this.prisma.compte.findMany({
        orderBy: {
          creeLe: 'desc',
        },
      });

    return comptes;
  }

  // ================= GET ONE =================

  async findOne(id: string) {

    const compte =
      await this.prisma.compte.findUnique({
        where: { id },
      });

    if (!compte) {

      throw new NotFoundException(
        'Compte introuvable.',
      );

    }

    return compte;
  }

  // ================= UPDATE =================

  async update(
    id: string,
    updateCompteDto: UpdateCompteDto,
  ) {

    const compte =
      await this.prisma.compte.findUnique({
        where: { id },
      });

    if (!compte) {

      throw new NotFoundException(
        'Compte introuvable.',
      );

    }

    if (updateCompteDto.code) {

      const codeExiste =
        await this.prisma.compte.findFirst({
          where: {
            code: updateCompteDto.code,
            NOT: {
              id,
            },
          },
        });

      if (codeExiste) {

        throw new BadRequestException(
          'Ce code est déjà utilisé par un autre compte.',
        );

      }
    }

    const compteModifie =
      await this.prisma.compte.update({
        where: { id },
        data: updateCompteDto,
      });

    return {
      message: 'Compte modifié avec succès ✅',
      data: compteModifie,
    };
  }

  // ================= DELETE =================

  async remove(id: string) {

    const compte =
      await this.prisma.compte.findUnique({
        where: { id },
      });

    if (!compte) {

      throw new NotFoundException(
        'Compte introuvable.',
      );

    }

    await this.prisma.compte.delete({
      where: { id },
    });

    return {
      message: 'Compte supprimé avec succès ✅',
    };
  }
}