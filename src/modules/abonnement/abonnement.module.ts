import { Module } from '@nestjs/common';
import { AbonnementService } from './abonnement.service';
import { AbonnementController } from './abonnement.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AbonnementController],
  providers: [AbonnementService],
  imports: [PrismaModule], // 🔥 OBLIGATOIRE

})
export class AbonnementModule { }
