import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateClientDto {
    @IsNotEmpty({ message: 'Le nom du client est requis' })
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    nom!: string;

    @IsNotEmpty({ message: 'Le téléphone du client est requis' })
    @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
    telephone!: string;

    @IsOptional()
    @IsString({ message: "L'adresse doit être une chaîne de caractères" })
    adresse?: string;

    @IsOptional()
    @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
    notes?: string;

    @IsOptional()
    @IsNumber({}, { message: 'La limite de crédit doit être un nombre' })
    @Min(0, { message: 'La limite de crédit ne peut pas être négative' })
    limiteCredit?: number; // null/undefined = pas de limite
}