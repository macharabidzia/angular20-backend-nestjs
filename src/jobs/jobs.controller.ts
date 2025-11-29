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
  UseGuards,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { RequirePermissions } from 'src/core/decorators/permission.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // ==========================================================================
  // 📦 GET /jobs — Paginated & Filtered Jobs
  // ==========================================================================
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: JobsQueryDto) {
    try {
      const result = await this.jobsService.findAll(query);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Jobs fetched successfully',
        meta: {
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
        data: result.data,
      };
    } catch (error: any) {
      console.error('❌ Error fetching jobs:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ==========================================================================
  // 📄 GET /jobs/:id — Fetch Single Job
  // ==========================================================================
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Query('lang') lang?: string) {
    const jobId = Number(id);
    if (isNaN(jobId)) throw new BadRequestException('Invalid job ID');

    try {
      const job = await this.jobsService.findOne(jobId, lang);
      if (!job) throw new BadRequestException(`Job with ID ${id} not found`);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Job fetched successfully',
        data: job,
      };
    } catch (error: any) {
      console.error('❌ Error fetching job:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ==========================================================================
  // ➕ POST /jobs — Create New Job (Protected)
  // ==========================================================================
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @RequirePermissions('jobs:create')
  async create(@Body() dto: CreateJobDto) {
    try {
      const job = await this.jobsService.create(dto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Job created successfully',
        data: job,
      };
    } catch (error: any) {
      console.error('❌ Error creating job:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ==========================================================================
  // ✏️ PATCH /jobs/:id — Update Job (Protected)
  // ==========================================================================
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @RequirePermissions('jobs:update')
  async update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    const jobId = Number(id);
    if (isNaN(jobId)) throw new BadRequestException('Invalid job ID');

    try {
      const job = await this.jobsService.update(jobId, dto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Job updated successfully',
        data: job,
      };
    } catch (error: any) {
      console.error('❌ Error updating job:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ==========================================================================
  // ❌ DELETE /jobs/:id — Delete Job (Protected)
  // ==========================================================================
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @RequirePermissions('jobs:delete')
  async remove(@Param('id') id: string) {
    const jobId = Number(id);
    if (isNaN(jobId)) throw new BadRequestException('Invalid job ID');

    try {
      await this.jobsService.remove(jobId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Job deleted successfully',
      };
    } catch (error: any) {
      console.error('❌ Error deleting job:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
