import { JobType, Experience } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
  Min,
} from 'class-validator';

export class JobTranslationDto {
  @IsString()
  lang: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  // ✅ Optional fields that exist in JobTranslation model
  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  requirements?: string;
}

export class CreateJobDto {
  // ─────────── Core ───────────
  @IsEnum(JobType)
  type: JobType;

  @IsInt()
  userId: number;

  @IsInt()
  countryId: number;

  @IsInt()
  cityId: number;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  // ─────────── Salary & Skills ───────────
  @IsOptional()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @Min(0)
  salaryMax?: number;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  // ─────────── Experience & Expiration ───────────
  @IsOptional()
  @IsEnum(Experience)
  experience?: Experience;

  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;

  // ─────────── Flags ───────────
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  // ─────────── Translations ───────────
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobTranslationDto)
  translations: JobTranslationDto[];
}
