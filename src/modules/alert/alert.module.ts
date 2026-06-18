import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AlertController],
  providers: [AlertService],
  imports: [PrismaModule]
})
export class AlertModule {}
