import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  /** POST /cities — create */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCityDto) {
    try {
      const city = await this.citiesService.create(dto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'City created successfully',
        data: city,
      };
    } catch (err: any) {
      console.error('Error creating city:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /** GET /cities — list all or filter by country */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('countryId') countryId?: string,
    @Query('lang') lang?: string,
  ) {
    try {
      const result = await this.citiesService.findAll(
        countryId ? +countryId : undefined,
        lang,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Cities fetched successfully',
        data: result,
      };
    } catch (err: any) {
      console.error('Error fetching cities:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /** GET /cities/:id — get single city */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang?: string,
  ) {
    try {
      const city = await this.citiesService.findOne(id, lang);
      if (!city) throw new BadRequestException(`City with ID ${id} not found`);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'City fetched successfully',
        data: city,
      };
    } catch (err: any) {
      console.error('Error fetching city:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /** PATCH /cities/:id — update */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCityDto) {
    try {
      const updated = await this.citiesService.update(id, dto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'City updated successfully',
        data: updated,
      };
    } catch (err: any) {
      console.error('Error updating city:', err);
      throw new InternalServerErrorException(err.message);
    }
  }

  /** DELETE /cities/:id — remove */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.citiesService.remove(id);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'City deleted successfully',
      };
    } catch (err: any) {
      console.error('Error deleting city:', err);
      throw new InternalServerErrorException(err.message);
    }
  }
}
