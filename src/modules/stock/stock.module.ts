import { forwardRef, Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { CaisseModule } from '../caisse/caisse.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => CaisseModule),
  ],
  providers: [StockService],
  controllers: [StockController],
  exports: [StockService],  // ← OBLIGATOIRE
})
export class StockModule {}