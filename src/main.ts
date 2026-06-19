import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permet à votre futur Angular sur Vercel de requêter ce backend
  app.enableCors();

  console.log('🚀 START BOOTSTRAP');

  // Utilise le port de Render en production, ou 3000 en local
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Serveur NestJS démarré avec succès sur le port : ${port}`);
}

bootstrap();