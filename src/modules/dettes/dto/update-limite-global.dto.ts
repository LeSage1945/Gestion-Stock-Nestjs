import { IsNumber, Min } from 'class-validator';

export class UpdateLimiteGlobaleDto {
  @IsNumber()
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  limiteGlobale!: number;
}