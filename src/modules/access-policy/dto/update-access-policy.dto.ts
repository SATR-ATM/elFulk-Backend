import { PartialType } from '@nestjs/mapped-types';
import { CreateAccessPolicyDto } from './create-access-policy.dto';

export class UpdateAccessPolicyDto extends PartialType(CreateAccessPolicyDto) {}
