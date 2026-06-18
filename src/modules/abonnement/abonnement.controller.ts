import { Controller, Post, Body, Req, UseGuards, Get, Param } from '@nestjs/common';
import { AbonnementService } from './abonnement.service';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';
import { ActivateAbonnementDto } from './dto/create-abonnement.dto';

@UseGuards(AuthGuard)
@Controller('abonnement')
export class AbonnementController {

  constructor(private readonly abonnementService: AbonnementService) { }

  @Post('activer/:compteId')
  activer(
    @Param('compteId') compteId: string,
    @Body() dto: ActivateAbonnementDto
  ) {
    return this.abonnementService.activerAbonnement(
      compteId,
      dto.dureeJours ?? 30,
    );
  }

  @Post('activer/:compteId')
  activerPourCompte(
    @Param('compteId') compteId: string,
    @Body() dto: ActivateAbonnementDto,
  ) {
    return this.abonnementService.activerAbonnement(
      compteId,
      dto.dureeJours ?? 30,
    );
  }

  @Post('desactiver/:compteId')
  async desactiver(@Param('compteId') compteId: string) {
    return this.abonnementService.desactiverAbonnement(compteId);
  }

  @Get('status')
  status(@Req() req: any) {
    return this.abonnementService.getStatus(req.user.compteId);
  }

  @Get('getAllAbonnements')
  getAllAbonnements() {
    return this.abonnementService.getAllAbonnements();
  }
}