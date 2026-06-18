import { Module } from '@nestjs/common';
import { CompteService } from './compte.service';
import { CompteController } from './compte.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [CompteController],
  providers: [CompteService],
  imports: [PrismaModule]
})
export class CompteModule { }
