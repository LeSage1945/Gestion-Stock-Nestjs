import { PartialType } from '@nestjs/mapped-types';
import { ActivateAbonnementDto } from './create-abonnement.dto';

export class UpdateAbonnementDto extends PartialType(ActivateAbonnementDto) {}