// dto/register.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UserTranslationDto {
  @IsString()
  lang: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  username: string;

  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserTranslationDto)
  @Transform(
    ({ value }) => (typeof value === 'string' ? JSON.parse(value) : value),
    { toClassOnly: true }, // <--- important
  )
  translations?: UserTranslationDto[];

}
