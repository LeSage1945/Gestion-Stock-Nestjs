import { Transform, Type } from "class-transformer"
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, Min } from "class-validator"

export class CreateProduitDto {

    @IsOptional()  // ← ajouté
    @IsUUID()
    id?: string    // ← optionnel

    @IsNotEmpty({ message: 'Le nom est obligatoire' })
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères' })
    @Transform(({ value }) => value.trim())
    nom!: string

    @IsNotEmpty({ message: 'Le nom est obligatoire' })
    @IsString({ message: 'La marque doit être une chaîne de caractères' })
    @MaxLength(50, { message: 'La marque ne doit pas dépasser 50 caractères' })
    @Transform(({ value }) => value.trim())
    marque!: string

    @Type(() => Number)
    @IsNumber({}, { message: 'le prix doit être un nombre' })
    @IsPositive({ message: 'le prix doit être positif' })
    prix!: number

    @Type(() => Number)
    @IsNumber({}, { message: 'Le seuil doit être un nombre' })
    @Min(0, { message: 'Le seuil ne peut pas être négatif' })
    seuilAlerte!: number;
}