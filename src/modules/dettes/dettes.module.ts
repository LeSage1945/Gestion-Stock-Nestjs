import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CaisseModule } from '../caisse/caisse.module';
import { DetteController } from './dettes.controller';
import { DetteService } from './dettes.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => CaisseModule),
  ],
  controllers: [DetteController],
  providers: [DetteService],
})
export class DettesModule { }
