// dto/create-dette-manuelle.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateDetteManuelleDto {
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsNumber()
  @IsPositive()
  montant!: number;

  @IsOptional()
  @IsString()
  motif?: string;
}