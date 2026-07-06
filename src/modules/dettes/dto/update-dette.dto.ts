import { PartialType } from '@nestjs/mapped-types';
import { CreateRemboursementDto } from './create-dette.dto';

export class UpdateDetteDto extends PartialType(CreateRemboursementDto) {}
