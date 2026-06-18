import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AbonnementService } from 'src/modules/abonnement/abonnement.service';

@Injectable()
export class AbonnementGuard implements CanActivate {

  constructor(private abonnementService: AbonnementService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const req = context.switchToHttp().getRequest();

    const user = req.user;

    if (!user?.compteId) {
      throw new UnauthorizedException('Token invalide');
    }

    await this.abonnementService.checkCompteActif(user.compteId);

    return true;
  }
}