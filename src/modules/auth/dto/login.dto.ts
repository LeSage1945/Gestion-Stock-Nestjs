import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {

    @IsEmail({}, { message: 'Email invalide' })
    @IsNotEmpty({ message: 'Email obligatoire' })
    email!: string;

    @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    @IsNotEmpty({ message: 'Mot de passe obligatoire' })
    password!: string;

    @IsString({ message: 'Le code entreprise doit être une chaîne de caractères' })
    @IsNotEmpty({ message: 'Code entreprise obligatoire' })
    code!: string;
}