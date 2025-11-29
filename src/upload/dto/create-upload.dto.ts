// create-upload.dto.ts
import { IsEnum, IsOptional, IsString, IsInt } from 'class-validator';
import { ImageType, EntityType } from '@prisma/client';

export class CreateUploadDto {
  @IsEnum(ImageType)
  type: ImageType;

  @IsEnum(EntityType)
  entityType: EntityType;

  @IsInt()
  entityId: number; // User ID, Job ID, etc.

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  lang?: string; // for translations
}
