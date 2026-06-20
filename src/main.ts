import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permet à votre futur Angular sur Vercel de requêter ce backend
  app.enableCors();

  // 🔥 Active la validation automatique de tous les DTOs (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // supprime les champs non déclarés dans le DTO
      forbidNonWhitelisted: true, // rejette la requête si un champ inconnu est envoyé
      transform: true,           // convertit automatiquement les types (ex: string -> number)
    }),
  );

  console.log('🚀 START BOOTSTRAP');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Serveur NestJS démarré avec succès sur le port : ${port}`);
}

bootstrap();