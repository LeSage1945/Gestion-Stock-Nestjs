import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLigneVenteDto } from 'src/modules/ligne-vente/dto/create-ligne-vente.dto';
import { CreatePaiementDto } from 'src/modules/paiement/dto/create-paiement.dto';

export class CreateVenteDto {

  @IsNotEmpty({ message: "L'utilisateur est obligatoire" })
  @IsUUID('4', { message: "L'identifiant utilisateur doit être un UUID valide" })
  utilisateurId!: string;

  @IsNotEmpty({ message: "Le montant total est obligatoire" })
  @IsNumber({}, { message: "Le montant total doit être un nombre" })
  montantTotal!: number;

  @IsOptional()
  @IsArray({ message: "Les lignes doivent être un tableau" })
  @ValidateNested({ each: true })
  @Type(() => CreateLigneVenteDto)
  lignes?: CreateLigneVenteDto[];

  @IsOptional()
  @IsArray({ message: "Les paiements doivent être un tableau" })
  @ValidateNested({ each: true })
  @Type(() => CreatePaiementDto)
  paiements?: CreatePaiementDto[];
}