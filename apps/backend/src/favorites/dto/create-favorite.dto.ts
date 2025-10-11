import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFavoriteDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  documentId: number;
}
