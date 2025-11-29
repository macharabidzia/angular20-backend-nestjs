// dto/update-job.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto, JobTranslationDto } from './create-job.dto';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobTranslationDto)
  translations?: JobTranslationDto[];
}
