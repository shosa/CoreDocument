import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  documentId: string;
}
