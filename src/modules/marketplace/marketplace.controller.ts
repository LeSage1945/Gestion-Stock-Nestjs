import { Controller, Get, Param } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) { }

  @Get('categories')
  getCategories() {
    return this.marketplaceService.getCategories();
  }

  @Get('categories/:id/boutiques')
  getBoutiques(@Param('id') id: string) {
    return this.marketplaceService.getBoutiquesByCategorie(id);
  }

  @Get('boutiques/:id')
  getBoutiqueDetail(@Param('id') id: string) {
    return this.marketplaceService.getBoutiqueDetail(id);
  }

  @Get('boutiques/:id/produits')
  getProduitsBoutique(@Param('id') id: string) {
    return this.marketplaceService.getProduitsBoutique(id);
  }
}