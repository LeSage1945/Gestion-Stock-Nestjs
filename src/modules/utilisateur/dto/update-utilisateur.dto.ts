import { Role } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateUtilisateurDto {

  @IsUUID('4', { message: "L'identifiant doit être un UUID valide" })
  id!: string;

  @IsOptional()
  @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  nom?: string;

  @IsOptional()
  @MaxLength(100, { message: 'Email trop long' })
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Le mot de passe doit être une chaîne' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  @MaxLength(100, { message: 'Mot de passe trop long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir au moins une lettre et un chiffre',
  })
  motDePasse?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Rôle invalide' })
  role?: Role;
}