import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) { }

  async signIn(loginDto: LoginDto): Promise<any> {
    const { email, password, code } = loginDto;

    // 1. Trouver le compte par code
    const compte = await this.prismaService.compte.findUnique({
      where: { code },
      include: {
        abonnement: true,
      },
    });

    if (!compte) {
      throw new UnauthorizedException('Code entreprise invalide');
    }

    // 2. Trouver l'utilisateur dans ce compte
    const user = await this.prismaService.utilisateur.findFirst({
      where: {
        email,
        compteId: compte.id,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    // 3. Vérifier mot de passe
    const isMatch = await bcrypt.compare(password, user.motDePasse);

    if (!isMatch) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    // 4. Vérifier abonnement
    if (
      !compte.abonnement ||
      compte.abonnement.statut !== 'ACTIF'
    ) {
      throw new UnauthorizedException('Abonnement expiré ou inactif');
    }

    // 5. Générer JWT
    const payload = {
      sub: user.id,
      email: user.email,
      compteId: compte.id,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        compteId: compte.id,
      },
    };
  }
}