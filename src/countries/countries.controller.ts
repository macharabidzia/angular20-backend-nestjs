import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  // ==========================================================================
  // 📦 GET /countries — All countries (cached)
  // ==========================================================================
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('lang') lang?: string) {
    try {
      const countries = await this.countriesService.findAll(lang);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Countries fetched successfully (cached)',
        meta: { total: countries.length },
        data: countries,
      };
    } catch (error: any) {
      console.error('❌ Error fetching countries:', error);
      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch countries',
      );
    }
  }

  // ==========================================================================
  // 📘 GET /countries/:id — Single country (cached)
  // ==========================================================================
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Query('lang') lang?: string) {
    const countryId = Number(id);
    if (isNaN(countryId)) {
      throw new BadRequestException('Invalid country ID');
    }

    try {
      const country = await this.countriesService.findOne(countryId, lang);
      if (!country) {
        throw new BadRequestException(`Country with ID ${id} not found`);
      }

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Country fetched successfully (cached)',
        data: country,
      };
    } catch (error: any) {
      console.error('❌ Error fetching country:', error);
      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch country',
      );
    }
  }

  // ==========================================================================
  // 🏙️ GET /countries/:id/cities — Cities of country (cached)
  // ==========================================================================
  @Get(':id/cities')
  @HttpCode(HttpStatus.OK)
  async findCities(@Param('id') id: string, @Query('lang') lang?: string) {
    const countryId = Number(id);
    if (isNaN(countryId)) {
      throw new BadRequestException('Invalid country ID');
    }

    try {
      const cities = await this.countriesService.findCities(countryId, lang);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Cities fetched successfully (cached)',
        meta: { total: cities.length },
        data: cities,
      };
    } catch (error: any) {
      console.error('❌ Error fetching cities:', error);
      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch cities',
      );
    }
  }

  // ==========================================================================
  // ➕ POST /countries — Create new country (invalidates cache)
  // ==========================================================================
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCountryDto) {
    try {
      const country = await this.countriesService.create(dto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Country created successfully (cache invalidated)',
        data: country,
      };
    } catch (error: any) {
      console.error('❌ Error creating country:', error);
      throw new InternalServerErrorException(
        error?.message || 'Failed to create country',
      );
    }
  }

  // ==========================================================================
  // ✏️ PATCH /countries/:id — Update country (invalidates cache)
  // ==========================================================================
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    const countryId = Number(id);
    if (isNaN(countryId)) {
      throw new BadRequestException('Invalid country ID');
    }

    try {
      const updated = await this.countriesService.update(countryId, dto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Country updated successfully (cache invalidated)',
        data: updated,
      };
    } catch (error: any) {
      console.error('❌ Error updating country:', error);
      throw new InternalServerErrorException(
        error?.message || 'Failed to update country',
      );
    }
  }

  // ==========================================================================
  // ❌ DELETE /countries/:id — Remove country (invalidates cache)
  // ==========================================================================
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const countryId = Number(id);
    if (isNaN(countryId)) {
      throw new BadRequestException('Invalid country ID');
    }

    try {
      await this.countriesService.remove(countryId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Country deleted successfully (cache invalidated)',
      };
    } catch (error: any) {
      console.error('❌ Error deleting country:', error);
      throw new InternalServerErrorException(
        error?.message || 'Failed to delete country',
      );
    }
  }

  // ==========================================================================
  // 🧹 DELETE /countries/cache/clear — Manual cache clear (Redis + memory)
  // ==========================================================================
  @Delete('cache/clear')
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    try {
      await (this.countriesService as any).invalidateCache();
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Countries cache cleared (Redis + memory)',
      };
    } catch (error: any) {
      console.error('❌ Error clearing cache:', error);
      throw new InternalServerErrorException(
        error?.message || 'Failed to clear cache',
      );
    }
  }
}
