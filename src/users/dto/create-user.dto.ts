import { IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { RoleName } from "@prisma/client";
import { Type, Transform } from "class-transformer";

export class UserTranslationDto {
  @IsString()
  lang: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class CreateUserDto {
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
  @IsEnum(RoleName)
  role?: RoleName; // only enum names USER | ADMIN | MODERATOR | HR

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserTranslationDto)
  @Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value, { toClassOnly: true })
  translations?: UserTranslationDto[];
}
