import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminMarketplaceService } from './admin-marketplac.service';
import { AdminMarketplaceController } from './admin-marketplac.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminMarketplaceController], // ✅ BON
  providers: [AdminMarketplaceService],
})
export class AdminMarketplaceModule { }