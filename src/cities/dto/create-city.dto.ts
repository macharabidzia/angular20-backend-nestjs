import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CityTranslationDto {
  lang: string;
  name: string;
}

export class CreateCityDto {
  @IsInt()
  countryId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CityTranslationDto)
  translations: CityTranslationDto[];
}
