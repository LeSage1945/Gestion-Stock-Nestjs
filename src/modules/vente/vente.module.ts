import { Module } from '@nestjs/common';
import { VenteService } from './vente.service';
import { VenteController } from './vente.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [VenteController],
  providers: [VenteService],
  imports: [PrismaModule]
})
export class VenteModule {}
