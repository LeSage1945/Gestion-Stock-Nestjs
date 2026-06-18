import { Module } from '@nestjs/common';
import { FournisseurService } from './fournisseur.service';
import { FournisseurController } from './fournisseur.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [FournisseurController],
  providers: [FournisseurService],
  imports: [PrismaModule]
})
export class FournisseurModule {}
