import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { BoutiqueService } from './boutique.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { StatutCommande } from '@prisma/client';

@Controller('boutique') // ← pas de @UseGuards : routes publiques
export class BoutiqueController {
  constructor(private readonly boutiqueService: BoutiqueService) { }

  @Get('produits')
  getProduits(@Query('compteId') compteId: string) {
    return this.boutiqueService.getProduitsVisibles(compteId);
  }

  @Get('produits/:id')
  getProduitDetail(@Param('id') id: string) {
    return this.boutiqueService.getProduitDetail(id);
  }

  @Post('commande')
  createCommande(@Body() dto: CreateCommandeDto) {
    return this.boutiqueService.createCommande(dto);
  }

  @Get('commandes')
  getCommandes(
    @Query('compteId') compteId: string,
    @Query('statut') statut?: StatutCommande,
  ) {
    return this.boutiqueService.getCommandes(compteId, statut);
  }

  @Get('commande/:id')
  getCommande(@Param('id') id: string) {
    return this.boutiqueService.getCommande(id);
  }

  @Put('commande/:id/statut')
  updateStatutCommande(
    @Param('id') id: string,
    @Body('statutCommande') statutCommande: StatutCommande,
    @Body('utilisateurId') utilisateurId?: string,
  ) {
    return this.boutiqueService.updateStatutCommande(id, statutCommande, utilisateurId);
  }
}