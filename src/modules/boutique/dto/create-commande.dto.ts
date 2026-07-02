import { TypeLivraison } from "@prisma/client";
import { Type } from "class-transformer";
import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional, IsArray, ArrayMinSize, ValidateNested } from "class-validator";

export class LigneCommandeDto {
    @IsString({ message: 'produitId doit être une chaîne de caractères' })
    @IsNotEmpty({ message: 'produitId est obligatoire' })
    produitId!: string;

    @IsNumber({}, { message: 'quantite doit être un nombre' })
    @Min(1, { message: 'quantite doit être au moins 1' })
    quantite!: number;
}

export class CreateCommandeDto {
    @IsString({ message: 'clientNom doit être une chaîne de caractères' })
    @IsNotEmpty({ message: 'clientNom est obligatoire' })
    clientNom!: string;

    @IsString({ message: 'clientTelephone doit être une chaîne de caractères' })
    @IsNotEmpty({ message: 'clientTelephone est obligatoire' })
    clientTelephone!: string;

    @IsEnum(TypeLivraison, { message: 'typeLivraison doit être LIVRAISON ou RETRAIT_BOUTIQUE' })
    typeLivraison!: TypeLivraison;

    @IsOptional()
    @IsString({ message: 'adresseLivraison doit être une chaîne de caractères' })
    adresseLivraison?: string;

    @IsOptional()
    @IsString({ message: 'villeLivraison doit être une chaîne de caractères' })
    villeLivraison?: string;

    @IsOptional()
    @IsString({ message: 'notesClient doit être une chaîne de caractères' })
    notesClient?: string;

    @IsArray({ message: 'lignes doit être un tableau' })
    @ArrayMinSize(1, { message: 'lignes doit contenir au moins un élément' })
    @ValidateNested({ each: true })
    @Type(() => LigneCommandeDto)
    lignes!: LigneCommandeDto[];

    @IsString({ message: 'compteId doit être une chaîne de caractères' })
    @IsNotEmpty({ message: 'compteId est obligatoire' })
    compteId!: string;
}