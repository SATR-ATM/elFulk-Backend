import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  childId: string;

  @IsNumber()
  @IsOptional()
  endTime?: number;
}
