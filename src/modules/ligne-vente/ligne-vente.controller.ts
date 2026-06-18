import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LigneVenteService } from './ligne-vente.service';
import { CreateLigneVenteDto } from './dto/create-ligne-vente.dto';
import { UpdateLigneVenteDto } from './dto/update-ligne-vente.dto';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('ligne-vente')
export class LigneVenteController {
  constructor(private readonly ligneVenteService: LigneVenteService) {}

  @Post()
  create(@Body() createLigneVenteDto: CreateLigneVenteDto) {
    return this.ligneVenteService.create(createLigneVenteDto);
  }

  @Get()
  findAll() {
    return this.ligneVenteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ligneVenteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLigneVenteDto: UpdateLigneVenteDto) {
    return this.ligneVenteService.update(+id, updateLigneVenteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ligneVenteService.remove(+id);
  }
}
