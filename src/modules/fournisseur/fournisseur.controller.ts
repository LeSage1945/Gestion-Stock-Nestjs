import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { FournisseurService } from './fournisseur.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('fournisseur')
export class FournisseurController {
  constructor(private readonly fournisseurService: FournisseurService) { }

  @Post('create')
  @Post('create')
  create(@Body() dto: CreateFournisseurDto, @Req() req: any) {
    const compteId = req.user.sub; // 🔥 récupéré du token

    return this.fournisseurService.create(dto, compteId);
  }

  @Get('getAll')
  findAll() {
    console.log("coucou")
    return this.fournisseurService.findAll();
  }

  @Get('get/one/:id')
  findOne(@Param('id') id: string) {
    return this.fournisseurService.findOne(id);
  }

  @Put('update/:id')
  update(@Param('id') id: string, @Body() updateFournisseurDto: UpdateFournisseurDto) {
    return this.fournisseurService.update(id, updateFournisseurDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.fournisseurService.remove(id);
  }
}
