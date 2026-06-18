import {
  IsUUID,
  IsInt,
  IsNumber,
  Min,
  IsNotEmpty
} from 'class-validator';

export class CreateLigneVenteDto {

  @IsNotEmpty({ message: "Le produit est obligatoire" })
  @IsUUID('4', { message: "L'identifiant du produit est invalide" })
  produitId!: string;

  @IsNotEmpty({ message: "La quantité est obligatoire" })
  @IsInt({ message: "La quantité doit être un entier" })
  @Min(1, { message: "La quantité doit être supérieure à 0" })
  quantite!: number;

  @IsNotEmpty({ message: "Le prix est obligatoire" })
  @IsNumber({}, { message: "Le prix doit être un nombre" })
  @Min(0, { message: "Le prix ne peut pas être négatif" })
  prix!: number;
}