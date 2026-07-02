import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { UtilisateurModule } from './modules/utilisateur/utilisateur.module';
import { ProduitModule } from './modules/produit/produit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { StockModule } from './modules/stock/stock.module';
import { FournisseurModule } from './modules/fournisseur/fournisseur.module';
import { AlertModule } from './modules/alert/alert.module';
import { VenteModule } from './modules/vente/vente.module';
import { LigneVenteModule } from './modules/ligne-vente/ligne-vente.module';
import { PaiementModule } from './modules/paiement/paiement.module';
import { AbonnementModule } from './modules/abonnement/abonnement.module';
import { AbonnementCheckMiddleware } from './middleware/abonnement-check/abonnement-check.middleware';
import { CompteModule } from './modules/compte/compte.module';
import { CaisseModule } from './modules/caisse/caisse.module';
import { BoutiqueModule } from './modules/boutique/boutique.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { AdminMarketplaceModule } from './modules/admin-marketplac/admin-marketplac.module';


@Module({
  imports: [
    PrismaModule,
    UtilisateurModule,
    ProduitModule,
    AuthModule,
    StockModule,
    FournisseurModule,
    AlertModule,
    VenteModule,
    LigneVenteModule,
    PaiementModule,
    AbonnementModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CompteModule,
    CaisseModule,
    BoutiqueModule,
    MarketplaceModule,
    AdminMarketplaceModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer
    //   .apply(AbonnementCheckMiddleware)
    //   .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}