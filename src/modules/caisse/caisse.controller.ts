import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CaisseService } from './caisse.service';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('caisse')
export class CaisseController {
  constructor(private readonly caisseService: CaisseService) { }

  @Get('solde')
  // getSolde(@Req() req: any) {
  //   return this.caisseService.getSolde(req.user.compteId);
  // }
  // caisse.controller.ts
  async getSolde(compteId: string) {
    const solde = await this.caisseService.getSolde(compteId);
    return { solde }; // ← renvoie un objet au frontend
  }

  @Get('all')
  getAll(@Req() req: any) {
    return this.caisseService.getAll(req.user.compteId);
  }

  @Post('manuel')
  addManuel(@Body() dto: any, @Req() req: any) {
    return this.caisseService.addManuel(req.user.compteId, dto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.caisseService.remove(id, req.user.compteId);
  }
}