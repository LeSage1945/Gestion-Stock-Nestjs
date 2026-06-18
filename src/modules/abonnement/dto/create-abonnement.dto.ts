import { IsInt, IsOptional } from 'class-validator';

export class ActivateAbonnementDto {
    @IsOptional()
    @IsInt()
    dureeJours?: number; // ex: 30 jours, 90 jours
}