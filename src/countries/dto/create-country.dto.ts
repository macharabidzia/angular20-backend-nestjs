// src/countries/dto/create-country.dto.ts
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CountryTranslationDto {
  @IsString()
  lang: string;

  @IsString()
  name: string;
}

export class CreateCountryDto {
  @IsString()
  code: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountryTranslationDto)
  translations: CountryTranslationDto[];
}
