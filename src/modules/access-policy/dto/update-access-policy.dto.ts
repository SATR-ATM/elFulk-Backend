import { PartialType } from '@nestjs/swagger';
import { CreateAccessPolicyDto } from './create-access-policy.dto';

export class UpdateAccessPolicyDto extends PartialType(CreateAccessPolicyDto) {}
