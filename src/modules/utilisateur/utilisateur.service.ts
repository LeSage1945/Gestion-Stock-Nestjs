import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UtilisateurService {
  constructor(private prismaService: PrismaService) { }

  // ======================
  // CREATE USER (SAAS)
  // ======================
  async create(createUtilisateurDto: CreateUtilisateurDto, compteId: string) {
    const { nom, email, motDePasse, role } = createUtilisateurDto;

    const existing = await this.prismaService.utilisateur.findFirst({
      where: {
        email,
        compteId,
      },
    });

    if (existing) {
      throw new BadRequestException('Cet email est déjà utilisé dans ce compte');
    }

    const hash = await bcrypt.hash(motDePasse, 10);

    try {
      return await this.prismaService.utilisateur.create({
        data: {
          nom,
          email,
          motDePasse: hash,
          role: role ?? Role.VENDEUR,
          compteId, // 🔥 IMPORTANT SAAS
        },
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
          creeLe: true,
          compteId: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la création');
    }
  }

  // ======================
  // GET ALL USERS (PAR COMPTE)
  // ======================
  async findAll(compteId: string) {
    return this.prismaService.utilisateur.findMany({
      where: { compteId }, // 🔥 FILTRE SAAS
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        creeLe: true,
      },
    });
  }

  // ======================
  // GET ALL ADMINS (GLOBAL - toutes boutiques)
  // ======================
  async findAllAdminsGlobal() {
    return this.prismaService.utilisateur.findMany({
      where: {
        role: Role.ADMIN,
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        creeLe: true,
        compteId: true, // important pour voir la boutique
      },
    });
  }

  // ======================
  // GET ONE USER
  // ======================
  async findOne(id: string, compteId: string) {
    return this.prismaService.utilisateur.findFirst({
      where: {
        id,
        compteId,
      },
    });
  }

  // ======================
  // UPDATE USER
  // ======================
  async update(id: string, updateUtilisateurDto: UpdateUtilisateurDto, compteId: string) {
    const { nom, email, motDePasse, role } = updateUtilisateurDto;

    const existing = await this.prismaService.utilisateur.findFirst({
      where: {
        id,
        compteId,
      },
    });

    if (!existing) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    const data: any = {};

    if (nom !== undefined) data.nom = nom;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;

    if (motDePasse) {
      data.motDePasse = await bcrypt.hash(motDePasse, 10);
    }

    return this.prismaService.utilisateur.update({
      where: { id },
      data,
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        creeLe: true,
      },
    });
  }

  // ======================
  // DELETE USER
  // ======================
  async remove(id: string, compteId: string) {
    const utilisateur = await this.prismaService.utilisateur.findFirst({
      where: {
        id,
        compteId,
      },
    });

    if (!utilisateur) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    await this.prismaService.paiement.deleteMany({
      where: {
        vente: {
          utilisateurId: id,
        },
      },
    });

    await this.prismaService.ligneVente.deleteMany({
      where: {
        vente: {
          utilisateurId: id,
        },
      },
    });

    await this.prismaService.vente.deleteMany({
      where: {
        utilisateurId: id,
      },
    });

    await this.prismaService.utilisateur.delete({
      where: { id },
    });

    return {
      message: 'Utilisateur supprimé avec succès',
    };
  }
}