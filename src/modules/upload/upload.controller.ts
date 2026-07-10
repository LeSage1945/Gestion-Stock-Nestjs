import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from 'src/common/gards/auth/auth.guard';

// ================= FILTRE : IMAGES UNIQUEMENT =================
function imageFileFilter(req: any, file: Express.Multer.File, callback: any) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    return callback(
      new BadRequestException('Seuls les fichiers image sont autorisés (jpg, png, webp, gif)'),
      false,
    );
  }
  callback(null, true);
}

@UseGuards(AuthGuard)
@Controller('upload')
export class UploadController {

  // ================= UPLOAD IMAGE PRODUIT =================
  @Post('produit')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/produits',
        filename: (req, file, callback) => {
          const nomUnique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          callback(null, nomUnique);
        },
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
    }),
  )
  uploadProduit(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu');
    }
    return { url: `/uploads/produits/${file.filename}` };
  }

  // ================= UPLOAD PHOTO UTILISATEUR =================
  @Post('utilisateur')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/utilisateurs',
        filename: (req, file, callback) => {
          const nomUnique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          callback(null, nomUnique);
        },
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadUtilisateur(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu');
    }
    return { url: `/uploads/utilisateurs/${file.filename}` };
  }
}