import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CaisseService } from './caisse.service';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('caisse')
export class CaisseController {
  constructor(private readonly caisseService: CaisseService) { }

  // ================= SOLDE =================
  @Get('solde')
  async getSolde(@Req() req: any) {
    return this.caisseService.getSolde(req.user.compteId);
  }

  // ================= GET ALL =================
  @Get('all')
  getAll(@Req() req: any) {
    return this.caisseService.getAll(req.user.compteId);
  }

  // ================= DÉTAIL =================
  @Get('detail/:id')
  getDetail(@Param('id') id: string, @Req() req: any) {
    return this.caisseService.getDetail(id, req.user.compteId);
  }

  // ================= MOUVEMENT MANUEL =================
  @Post('manuel')
  addManuel(@Body() dto: any, @Req() req: any) {
    return this.caisseService.addManuel(req.user.compteId, dto);
  }

  // ================= UPDATE =================
  @Put('update/:id')
  update(
    @Param('id') id: string,
    @Body() dto: { montant?: number; motif?: string },
    @Req() req: any
  ) {
    return this.caisseService.update(id, req.user.compteId, dto);
  }

  // ================= DELETE =================
  @Delete('delete/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.caisseService.remove(id, req.user.compteId);
  }
}