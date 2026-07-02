import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminMarketplacDto } from './create-admin-marketplac.dto';

export class UpdateAdminMarketplacDto extends PartialType(CreateAdminMarketplacDto) {}
