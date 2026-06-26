import { forwardRef, Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { CaisseModule } from '../caisse/caisse.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule ,forwardRef(() => CaisseModule)],  // ← forwardRef ici aussi
  providers: [StockService],
  controllers: [StockController],
  exports: [StockService],
})
export class StockModule {}