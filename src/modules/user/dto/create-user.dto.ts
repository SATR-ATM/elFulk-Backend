import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UsersType } from '../user.entity';

export class CreateUsersDto {
  @ApiProperty({
    description: "User's first name",
    example: 'John',
  })
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({
    description: "User's last name",
    example: 'Doe',
  })
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({
    description: 'Role/type of the user within the system',
    enum: UsersType,
    enumName: 'UsersType',
    example: UsersType.PARENT,
  })
  @IsEnum(UsersType)
  type: UsersType;
}
