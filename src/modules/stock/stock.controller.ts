import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';

import { StockService } from './stock.service';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';
import { CreateEntreeStockDto } from './dto/create-stock.dto';
import { CreateSortieStockDto } from './dto/createSortie-stock.dto';

@UseGuards(AuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) { }

  // ======================
  // AJOUT ENTREE STOCK
  // ======================
  @Post('entree')
  addEntree(@Body() dto: CreateEntreeStockDto, @Req() req: any) {
    console.log("entre")
    return this.stockService.addEntree(dto, req.user.compteId);
  }

  // ======================
  // AJOUT SORTIE STOCK
  // ======================
  @Post('sortie')
  addSortie(@Body() dto: CreateSortieStockDto, @Req() req: any) {
    return this.stockService.addSortie(dto, req.user.compteId);
  }

  // ======================
  // STOCK PAR PRODUIT
  // ======================
  @Get('produit/:id')
  getStock(@Param('id') id: string, @Req() req: any) {
    return this.stockService.getStockByProduit(id, req.user.compteId);
  }

  // ======================
  // TOUT LES STOCKS
  // ======================
  @Get('all')
  getAllStocks(@Req() req: any) {
    return this.stockService.getAllStocks(req.user.compteId);
  }

  // ======================
  // LISTE ENTREES
  // ======================
  @Get('entrees')
  findAllEntrees(@Req() req: any) {
    return this.stockService.findAllEntrees(req.user.compteId);
  }

  // ======================
  // LISTE SORTIES
  // ======================
  @Get('sorties')
  findAllSorties(@Req() req: any) {
    return this.stockService.findAllSorties(req.user.compteId);
  }

  // ======================
  // DELETE ENTREE
  // ======================
  @Delete('entree/:id')
  removeEntree(@Param('id') id: string, @Req() req: any) {
    return this.stockService.removeEntree(id, req.user.compteId);
  }

  // ======================
  // DELETE SORTIE
  // ======================
  @Delete('sortie/:id')
  removeSortie(@Param('id') id: string, @Req() req: any) {
    return this.stockService.removeSortie(id, req.user.compteId);
  }
}