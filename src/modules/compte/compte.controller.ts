import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';

import { CompteService } from './compte.service';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';

@Controller('comptes')
export class CompteController {

  constructor(
    private readonly compteService: CompteService,
  ) { }

  // ================= CREATE =================

  @Post()
  create(@Body() dto: CreateCompteDto) {
    return this.compteService.create(dto);
  }

  // ================= GET ALL =================

  @Get()
  findAll() {
    return this.compteService.findAll();
  }

  // ================= GET ONE =================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.compteService.findOne(id);
  }

  // ================= UPDATE =================

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompteDto,
  ) {
    return this.compteService.update(id, dto);
  }

  // ================= DELETE =================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.compteService.remove(id);
  }
}