import { Injectable } from '@nestjs/common';
import {
  MulterOptionsFactory,
  MulterModuleOptions,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          // Generate a unique file name
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          // file.fieldname is 'avatar' in this case
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      // Add limits here if you want to apply them globally
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB limit
      },
    };
  }
}
