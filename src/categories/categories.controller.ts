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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryDto) {
    try {
      const category = await this.categoriesService.create(dto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Category created successfully',
        data: category,
      };
    } catch (error: any) {
      console.error('Error creating category:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('lang') lang?: string) {
    try {
      const categories = await this.categoriesService.findAll(lang);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Categories fetched successfully',
        total: categories.length,
        data: categories,
      };
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Query('lang') lang?: string) {
    const categoryId = Number(id);
    if (isNaN(categoryId)) throw new BadRequestException('Invalid category ID');

    try {
      const category = await this.categoriesService.findOne(categoryId, lang);
      if (!category) {
        throw new BadRequestException(`Category with ID ${id} not found`);
      }

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Category fetched successfully',
        data: category,
      };
    } catch (error: any) {
      console.error('Error fetching category:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const categoryId = Number(id);
    if (isNaN(categoryId)) throw new BadRequestException('Invalid category ID');

    try {
      const updated = await this.categoriesService.update(categoryId, dto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Category updated successfully',
        data: updated,
      };
    } catch (error: any) {
      console.error('Error updating category:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const categoryId = Number(id);
    if (isNaN(categoryId)) throw new BadRequestException('Invalid category ID');

    try {
      await this.categoriesService.remove(categoryId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error: any) {
      console.error('Error deleting category:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
