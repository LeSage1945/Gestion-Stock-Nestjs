import { Module } from '@nestjs/common';
import { UtilisateurService } from './utilisateur.service';
import { UtilisateurController } from './utilisateur.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [UtilisateurController],
  providers: [UtilisateurService],
  imports: [PrismaModule]
})
export class UtilisateurModule {}
