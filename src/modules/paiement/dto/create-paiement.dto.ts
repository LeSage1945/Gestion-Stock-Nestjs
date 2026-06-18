import {
    IsNumber,
    IsNotEmpty,
    Min,
    IsEnum
} from 'class-validator';
import { MethodePaiement } from '@prisma/client';

export class CreatePaiementDto {

    @IsNotEmpty({ message: "Le montant est obligatoire" })
    @IsNumber({}, { message: "Le montant doit être un nombre" })
    @Min(1, { message: "Le montant doit être supérieur à 0" })
    montant!: number;

    @IsNotEmpty({ message: "La méthode de paiement est obligatoire" })
    @IsEnum(MethodePaiement, {
        message: "La méthode de paiement doit être ESPECE ou MOBILE_MONEY"
    })
    methodePaiement!: MethodePaiement;
}