import { forwardRef, Module } from '@nestjs/common';
import { CaisseController } from './caisse.controller';
import { CaisseService } from './caisse.service';
import { StockModule } from '../stock/stock.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule ,forwardRef(() => StockModule)],  // ← et ici
  providers: [CaisseService],
  controllers: [CaisseController],
  exports: [CaisseService],
})
export class CaisseModule {}