import { IsString, IsNotEmpty, Length, IsOptional, Matches } from "class-validator";

export class CreateFournisseurDto {
  @IsString({ message: "Le nom doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le nom du fournisseur est obligatoire" })
  @Length(2, 100, { message: "Le nom doit contenir entre 2 et 100 caractères" })
  nom!: string;

  @IsOptional()
  @IsString({ message: "Le numéro de téléphone doit être une chaîne de caractères" })
  @Matches(/^[0-9+ ]+$/, { message: "Le numéro de téléphone est invalide" })
  telephone?: string;

  @IsOptional()
  @IsString({ message: "L'adresse doit être une chaîne de caractères" })
  @Length(3, 255, { message: "L'adresse doit contenir entre 3 et 255 caractères" })
  adresse?: string;
}
