import { Injectable } from '@nestjs/common';
import { CreateUploadDto } from './dto/create-upload.dto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async create(file: Express.Multer.File, dto: CreateUploadDto) {
    // Save file to disk
    const uploadDir = join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, file.originalname);
    await fs.writeFile(filePath, file.buffer);

    // Save metadata in DB
    const image = await this.prisma.image.create({
      data: {
        url: `/uploads/${file.originalname}`,
        alt: dto.alt,
        type: dto.type,
        entityType: dto.entityType,
        entityId: dto.entityId,
        lang: dto.lang,
      },
    });

    return image;
  }

  findAll() {
    return this.prisma.image.findMany();
  }

  findByEntity(entityType: 'USER' | 'JOB', entityId: number) {
    return this.prisma.image.findMany({
      where: { entityType, entityId },
    });
  }

  async remove(id: number) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) return null;

    // Delete file from disk
    await fs.unlink(join(__dirname, '../../', image.url));

    // Delete DB record
    return this.prisma.image.delete({ where: { id } });
  }
}
