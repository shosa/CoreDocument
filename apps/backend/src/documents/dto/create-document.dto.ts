import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  docNumber?: string;

  @IsDateString()
  date: string;
}
