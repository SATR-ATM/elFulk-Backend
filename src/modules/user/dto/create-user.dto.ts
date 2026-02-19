import { IsEnum, IsNotEmpty } from 'class-validator';
import { UsersType } from '../user.entity';

export class CreateUsersDto {
  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;

  @IsEnum(UsersType)
  type: UsersType;
}
