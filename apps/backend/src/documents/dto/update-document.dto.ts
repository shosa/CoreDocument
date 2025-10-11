import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  docNumber?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
