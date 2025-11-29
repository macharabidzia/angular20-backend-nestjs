import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, ValidateNested, IsInt } from 'class-validator';

export class SalaryRangeDto {
  @IsOptional()
  @Type(() => Number)
  min?: number;

  @IsOptional()
  @Type(() => Number)
  max?: number;
}

export class JobsQueryDto {
  // ─────────────── Pagination & Sorting ───────────────
  @IsOptional()
  @Type(() => Number)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  limit = 10;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  order: 'asc' | 'desc' = 'desc';

  // ─────────────── Language & Search ───────────────
  @IsOptional()
  @IsString()
  lang?: string;

  @IsOptional()
  @IsString()
  search?: string;

  // ─────────────── Core Filters ───────────────
  @IsOptional()
  @Type(() => Number)
  countryId?: number;

  @IsOptional()
  @Type(() => Number)
  cityId?: number;

  @IsOptional()
  @IsString()
  type?: string;

  // ─────────────── Range & Multi Filters ───────────────
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryRangeDto)
  salary?: SalaryRangeDto;

  @IsOptional()
  @Transform(({ value }) => value?.split(',') ?? [])
  category?: string[];

  @IsOptional()
  @Transform(({ value }) => value?.split(',') ?? [])
  experience?: string[];

  @IsOptional()
  @Transform(({ value }) => value?.split(',') ?? [])
  jobTypes?: string[];

  // ─────────────── Flags ───────────────
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  remote?: boolean;
}
