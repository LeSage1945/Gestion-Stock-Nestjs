import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AbonnementService } from 'src/modules/abonnement/abonnement.service';

@Injectable()
export class AbonnementCheckMiddleware implements NestMiddleware {
  constructor(private abonnementService: AbonnementService) { }

  async use(req: Request, res: Response, next: NextFunction) {

    // ✅ EXCLUSION AUTH (IMPORTANT)
    if (req.url.includes('auth')) {
      return next();
    }

    const user: any = req['user'];

    if (!user?.compteId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    await this.abonnementService.checkCompteActif(user.compteId);

    next();
  }
}