import { IsNumber } from 'class-validator';

export class UpdateSessionDto {
  @IsNumber()
  endTime: number;
}
