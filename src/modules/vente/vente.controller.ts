import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';

import { VenteService } from './vente.service';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('vente')
export class VenteController {
  constructor(private readonly venteService: VenteService) { }

  // ================= CREATE VENTE =================
  @Post('create')
  create(@Body() dto: any, @Req() req: any) {
    return this.venteService.create(dto, req.user.compteId);
  }

  // ================= GET ALL VENTES =================
  @Get('all')
  findAll(@Req() req: any) {
    console.log('compteId:', req.user.compteId); // Debug log to check compteId
    return this.venteService.findAll(req.user.compteId);
  }

  // ================= GET ONE VENTE =================
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.venteService.findOne(id, req.user.compteId);
  }

  // ================= UPDATE VENTE =================
  @Put('update/:id')
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    return this.venteService.update(id, dto, req.user.compteId);
  }

  // ================= DELETE VENTE =================
  @Delete('delete/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.venteService.remove(id, req.user.compteId);
  }
}