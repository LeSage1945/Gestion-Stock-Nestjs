import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateBoutiqueDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    nom!: string;

    @IsOptional()
    @IsString()
    categorieId?: string;

    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    adresse?: string;

    @IsOptional()
    @IsString()
    ville?: string;

    // ===== PREMIER UTILISATEUR ADMIN DE LA BOUTIQUE =====
    @IsString()
    @IsNotEmpty()
    adminNom!: string;

    @IsEmail()
    adminEmail!: string;

    @IsString()
    @IsNotEmpty()
    adminMotDePasse!: string;
}