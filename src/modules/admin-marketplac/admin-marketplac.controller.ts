import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';
import { CreateBoutiqueDto } from '../boutique/dto/create-boutique.dto';
import { CreateCategorieDto } from '../marketplace/dto/create-categorie.dto';
import { AdminMarketplaceService } from './admin-marketplac.service';


@UseGuards(AuthGuard) // protégé — seul toi (super admin) dois y accéder
@Controller('admin/marketplace')
export class AdminMarketplaceController {
  constructor(private readonly adminService: AdminMarketplaceService) { }

  // ===== CATÉGORIES =====
  @Post('categories')
  createCategorie(@Body() dto: CreateCategorieDto) {
    return this.adminService.createCategorie(dto);
  }

  @Get('categories')
  getAllCategories() {
    return this.adminService.getAllCategories();
  }

  @Put('categories/:id')
  updateCategorie(@Param('id') id: string, @Body() dto: Partial<CreateCategorieDto>) {
    return this.adminService.updateCategorie(id, dto);
  }

  @Delete('categories/:id')
  deleteCategorie(@Param('id') id: string) {
    return this.adminService.deleteCategorie(id);
  }

  // ===== BOUTIQUES =====
  @Post('boutiques')
  createBoutique(@Body() dto: CreateBoutiqueDto) {
    return this.adminService.createBoutique(dto);
  }

  @Get('boutiques')
  getAllBoutiques() {
    return this.adminService.getAllBoutiques();
  }

  @Get('boutiques/:id')
  getBoutiqueById(@Param('id') id: string) {
    return this.adminService.getBoutiqueById(id);
  }

  @Put('boutiques/:id')
  updateBoutique(@Param('id') id: string, @Body() dto: Partial<CreateBoutiqueDto>) {
    return this.adminService.updateBoutique(id, dto);
  }

  @Put('boutiques/:id/toggle-visibilite')
  toggleVisibilite(@Param('id') id: string) {
    return this.adminService.toggleVisibiliteMarketplace(id);
  }

  @Delete('boutiques/:id')
  deleteBoutique(@Param('id') id: string) {
    return this.adminService.deleteBoutique(id);
  }
}