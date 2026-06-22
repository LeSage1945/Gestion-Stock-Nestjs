import { Role } from "@prisma/client";
import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from "class-validator";

export class CreateUtilisateurDto {

    @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères' })
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    nom!: string;

    @MaxLength(100, { message: 'Email trop long' })
    @IsEmail({}, { message: 'Email invalide' })
    email!: string;

    @IsString({ message: 'Le mot de passe doit être une chaîne' })
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    @MaxLength(100, { message: 'Mot de passe trop long' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
        message: 'Le mot de passe doit contenir au moins une lettre et un chiffre',
    })
    motDePasse!: string;

    @IsOptional()
    @IsEnum(Role, { message: 'Rôle invalide' })
    role?: Role;

    // compteId!: string; // 🔥 obligatoire ici

}