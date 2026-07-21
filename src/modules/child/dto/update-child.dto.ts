import { PartialType } from '@nestjs/swagger';
import { CreateChildDto } from './create-child.dto';

export class UpdateChildDto extends PartialType(CreateChildDto) {}
