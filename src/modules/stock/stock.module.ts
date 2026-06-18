import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [StockController],
  providers: [StockService],
  imports: [PrismaModule]
})
export class StockModule {}
