import { IsUUID, IsInt, Min } from "class-validator";

export class CreateAlertDto {
    @IsUUID('4', { message: 'Produit invalide (UUID requis)' })
    produitId!: string;

    @IsInt({ message: 'La quantité actuelle doit être un entier' })
    @Min(0, { message: 'La quantité actuelle ne peut pas être négative' })
    quantiteActuelle!: number;

    @IsInt({ message: 'Le niveau d’alerte doit être un entier' })
    @Min(1, { message: 'Le niveau d’alerte doit être supérieur à 0' })
    niveauAlerte!: number;
}
