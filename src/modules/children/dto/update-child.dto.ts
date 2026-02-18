import { PartialType } from '@nestjs/mapped-types';
import { CreateChildDto } from './create-child.dto';

export class UpdateChildDto extends PartialType(CreateChildDto) {}
