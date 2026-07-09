import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';
import { DetteService } from './dettes.service';
import { CreateRemboursementDto } from './dto/create-dette.dto';
import { CreateDetteManuelleDto } from './dto/create-dette-manuelle.dto';

@UseGuards(AuthGuard)
@Controller('dettes')
export class DetteController {
  constructor(private readonly detteService: DetteService) { }

  @Get()
  findAll(@Query('statut') statut: 'EN_COURS' | 'SOLDEE', @Req() req: any) {
    return this.detteService.findAll(req.user.compteId, statut);
  }

  @Get('en-cours')
  findEnCours(@Req() req: any) {
    return this.detteService.findEnCours(req.user.compteId);
  }

  @Get('total-en-cours')
  getTotalEnCours(@Req() req: any) {
    return this.detteService.getTotalEnCours(req.user.compteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.detteService.findOne(id, req.user.compteId);
  }

  // ← ajouté : création d'une dette manuelle (sans vente)
  @Post('manuelle')
  creerDetteManuelle(@Body() dto: CreateDetteManuelleDto, @Req() req: any) {
    return this.detteService.creerDetteManuelle(dto, req.user.compteId);
  }

  @Post(':id/remboursement')
  rembourser(
    @Param('id') id: string,
    @Body() dto: CreateRemboursementDto,
    @Req() req: any,
  ) {
    return this.detteService.rembourser(id, dto, req.user.compteId);
  }

  @Delete(':id')
  annulerDette(@Param('id') id: string, @Req() req: any) {
    return this.detteService.annulerDette(id, req.user.compteId);
  }

  @Delete('remboursement/:remboursementId')
  annulerRemboursement(
    @Param('remboursementId') remboursementId: string,
    @Req() req: any,
  ) {
    return this.detteService.annulerRemboursement(remboursementId, req.user.compteId);
  }
}