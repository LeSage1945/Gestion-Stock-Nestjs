

import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateSortieStockDto {

  @IsUUID('4', { message: 'Produit invalide (UUID requis)' })
  produitId!: string;

  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(1, { message: 'La quantité doit être supérieure à 0' })
  quantite!: number;

  @IsString({ message: 'La raison doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La raison est obligatoire' })
  raison!: string;
}