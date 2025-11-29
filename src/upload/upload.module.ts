import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { MulterConfigService } from './services/multer.config.service';

@Module({
  imports: [
    PrismaModule,
    // CRITICAL: Configure Multer asynchronously using the service
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
  ],
  providers: [UploadService, MulterConfigService],
  // Export MulterModule and UploadService so other modules (like AuthModule) can use them
  exports: [UploadService, MulterModule],
})
export class UploadModule {}
