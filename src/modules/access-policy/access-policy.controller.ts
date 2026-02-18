import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccessPolicyService } from './access-policy.service';
import { CreateAccessPolicyDto } from './dto/create-access-policy.dto';
import { UpdateAccessPolicyDto } from './dto/update-access-policy.dto';

@Controller('access-policy')
export class AccessPolicyController {
  constructor(private readonly accessPolicyService: AccessPolicyService) {}

  @Post()
  create(@Body() createAccessPolicyDto: CreateAccessPolicyDto) {
    return this.accessPolicyService.create(createAccessPolicyDto);
  }

  @Get()
  findAll() {
    return this.accessPolicyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accessPolicyService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccessPolicyDto: UpdateAccessPolicyDto,
  ) {
    return this.accessPolicyService.update(+id, updateAccessPolicyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessPolicyService.remove(+id);
  }
}
