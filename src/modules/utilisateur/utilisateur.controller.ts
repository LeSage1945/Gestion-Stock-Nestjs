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

import { UtilisateurService } from './utilisateur.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('utilisateur')
export class UtilisateurController {
  constructor(private readonly utilisateurService: UtilisateurService) { }

  // ======================
  // CREATE USER
  // ======================
  @Post('create/user')
  create(@Body() createUtilisateurDto: CreateUtilisateurDto, @Req() req: any,) {
    console.log('BODY:', createUtilisateurDto);
    console.log('USER:', req.user);
    return this.utilisateurService.create(
      createUtilisateurDto,
      req.user.compteId,
    );
  }

  // ======================
  // CREATION D'UN UTILISATEUR ET AFFECTION A UN COMPTE (SAAS)
  // ======================
  @Post('create/user/compte')
  createWithAccount(@Body() body: any) {
    console.log('BODY:', body);
    return this.utilisateurService.create(
      body.data,
      body.compte,
    );
  }

  // ======================
  // GET ALL ADMINS GLOBAL
  // ======================
  @Get('admins/global')
  findAllAdminsGlobal() {
    return this.utilisateurService.findAllAdminsGlobal();
  }

  // ======================
  // GET ALL USERS (COMPTE)
  // ======================
  @Get('getAll/user')
  findAll(@Req() req: any) {
    console.log(req.user)
    return this.utilisateurService.findAll(req.user.compteId);
  }

  // ======================
  // GET ONE USER
  // ======================
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.utilisateurService.findOne(id, req.user.compteId);
  }

  // ======================
  // UPDATE USER
  // ======================
  @Put('update/user/:id')
  update(
    @Param('id') id: string,
    @Body() updateUtilisateurDto: UpdateUtilisateurDto,
    @Req() req: any,
  ) {
    return this.utilisateurService.update(
      id,
      updateUtilisateurDto,
      req.user.compteId,
    );
  }

  // ======================
  // DELETE USER
  // ======================
  @Delete('delete/user/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.utilisateurService.remove(id, req.user.compteId);
  }
}