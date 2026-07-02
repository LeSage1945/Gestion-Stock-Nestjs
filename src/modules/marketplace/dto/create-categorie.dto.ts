import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategorieDto {

    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    @IsNotEmpty({ message: 'Le nom est obligatoire' })
    nom!: string;

    @IsOptional()
    @IsString({ message: 'L’icône doit être une chaîne de caractères' })
    icone?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'L’ordre doit être un nombre entier' })
    @Min(0, { message: 'L’ordre ne peut pas être négatif' })
    ordre?: number;
}