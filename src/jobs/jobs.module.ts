import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Module({
  imports: [CacheModule.register()],
  controllers: [JobsController],
  providers: [JobsService, PrismaService],
  exports: [JobsService],
})
export class JobsModule {}
