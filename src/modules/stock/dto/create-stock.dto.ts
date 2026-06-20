import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEntreeStockDto {

  @IsUUID('4', { message: 'Produit invalide (UUID requis)' })
  produitId!: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUUID('4', { message: 'Fournisseur invalide (UUID requis)' })
  fournisseurId?: string;

  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(1, { message: 'La quantité doit être supérieure à 0' })
  quantite!: number;

  @IsNumber({}, { message: 'Le prix d\'achat doit être un nombre' })
  @Min(0, { message: 'Le prix doit être positif' })
  prixAchat!: number;
}