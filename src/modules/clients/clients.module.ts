import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StockModule } from '../stock/stock.module';
import { ClientService } from './clients.service';
import { ClientsController } from './clients.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => StockModule)],  // ← et ici
  controllers: [ClientsController],
  providers: [ClientService],
})
export class ClientsModule { }
