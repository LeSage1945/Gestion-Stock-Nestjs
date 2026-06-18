import { Module } from '@nestjs/common';
import { ProduitService } from './produit.service';
import { ProduitController } from './produit.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProduitController],
  providers: [ProduitService, PrismaService],
})
export class ProduitModule {}
