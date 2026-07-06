import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum MethodePaiementEnum {
  ESPECE = 'ESPECE',
  MOBILE_MONEY = 'MOBILE_MONEY',
}

export class CreateRemboursementDto {
  @IsNotEmpty({ message: 'Le montant du remboursement est requis' })
  @IsNumber({}, { message: 'Le montant doit être un nombre' })
  @Min(1, { message: 'Le montant doit être supérieur à 0' })
  montant!: number;

  @IsNotEmpty({ message: 'La méthode de paiement est requise' })
  @IsEnum(MethodePaiementEnum, { message: 'Méthode de paiement invalide' })
  methodePaiement!: MethodePaiementEnum;

  @IsOptional()
  @IsString()
  motif?: string;
}