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

import { ProduitService } from './produit.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('produit')
export class ProduitController {
  constructor(private readonly produitService: ProduitService) { }

  // ======================
  // CREATE PRODUIT
  // ======================
  @Post('create')
  create(@Body() dto: CreateProduitDto, @Req() req: any) {
    console.log("dto")
    return this.produitService.createProduit(dto, req.user.compteId);
  }

  // ======================
  // GET ALL PRODUITS
  // ======================
  @Get('getAll')
  findAll(@Req() req: any) {
    return this.produitService.findAll(req.user.compteId);
  }

  // ======================
  // GET ONE PRODUIT
  // ======================
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.produitService.findOne(id, req.user.compteId);
  }

  // ======================
  // UPDATE PRODUIT
  // ======================
  @Put('update/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProduitDto,
    @Req() req: any,
  ) {
    return this.produitService.update(id, dto, req.user.compteId);
  }

  // ======================
  // DELETE PRODUIT
  // ======================
  @Delete('delete/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.produitService.remove(id, req.user.compteId);
  }
}