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
  // async remove(id: string, compteId: string) {
  //   const utilisateur = await this.prismaService.utilisateur.findFirst({
  //     where: {
  //       id,
  //       compteId,
  //     },
  //   });

  //   if (!utilisateur) {
  //     throw new BadRequestException('Utilisateur non trouvé');
  //   }

  //   await this.prismaService.paiement.deleteMany({
  //     where: {
  //       vente: {
  //         utilisateurId: id,
  //       },
  //     },
  //   });

  //   await this.prismaService.ligneVente.deleteMany({
  //     where: {
  //       vente: {
  //         utilisateurId: id,
  //       },
  //     },
  //   });

  //   await this.prismaService.vente.deleteMany({
  //     where: {
  //       utilisateurId: id,
  //     },
  //   });

  //   await this.prismaService.utilisateur.delete({
  //     where: { id },
  //   });

  //   return {
  //     message: 'Utilisateur supprimé avec succès',
  //   };
  // }

  async remove(id: string, compteId: string, roleConnecte: string) {
    // ==========================================
    // LOGS DE DIAGNOSTIC (À regarder dans le terminal)
    // ==========================================
    console.log('--- DEBUT TENTATIVE DE SUPPRESSION ---');
    console.log('ID reçu depuis Angular :', id);
    console.log('Compte ID de l\'admin connecté :', compteId);
    console.log('Rôle de l\'admin connecté :', roleConnecte);

    // 1. On vérifie d'abord si l'utilisateur existe, peu importe son entreprise
    const userExisteRecuperation = await this.prismaService.utilisateur.findUnique({
      where: { id },
    });
    console.log('Utilisateur trouvé en BDD uniquement par ID :', userExisteRecuperation);
    // ==========================================

    // 2. Préparation dynamique de la condition de recherche
    const conditionWhere: any = { id };

    // Si l'utilisateur connecté N'EST PAS le super admin, on bloque la recherche à son compte uniquement (Sécurité SaaS)
    if (roleConnecte !== 'SUPER_ADMIN_SAGE_066062594') {
      conditionWhere.compteId = compteId;
      console.log(`Sécurité SaaS activée : Recherche limitée au compte ${compteId}`);
    } else {
      console.log('Mode SUPER_ADMIN détecté : Recherche globale sans restriction de compte.');
    }

    // Recherche de l'utilisateur avec la condition filtrée ou non
    const utilisateur = await this.prismaService.utilisateur.findFirst({
      where: conditionWhere,
    });

    if (!utilisateur) {
      throw new BadRequestException('Utilisateur non trouvé ou droits insuffisants');
    }

    // 3. Suppression en cascade des dépendances (Paiements via Ventes)
    await this.prismaService.paiement.deleteMany({
      where: {
        vente: {
          utilisateurId: id,
        },
      },
    });

    // 4. Suppression des lignes de vente liées aux ventes de cet utilisateur
    await this.prismaService.ligneVente.deleteMany({
      where: {
        vente: {
          utilisateurId: id,
        },
      },
    });

    // 5. Suppression de toutes les ventes enregistrées par cet utilisateur
    await this.prismaService.vente.deleteMany({
      where: {
        utilisateurId: id,
      },
    });

    // 6. Enfin, suppression définitive de l'utilisateur
    await this.prismaService.utilisateur.delete({
      where: { id },
    });

    console.log(`L'utilisateur ${id} a été supprimé avec succès.`);
    console.log('--- FIN DE LA SUPPRESSION ---');

    return {
      message: 'Utilisateur supprimé avec succès',
    };
  }
}