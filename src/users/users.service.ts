import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users with optional language filter for translations
   */
  async findAll(lang?: string): Promise<User[]> {
    return this.prisma.user.findMany({
      include: this.getUserIncludes(lang),
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Get a single user by id with optional language filter
   */
  async findOne(id: number, lang?: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.getUserIncludes(lang),
    });

    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }

  /**
   * Create a user
   * Avatar should be added separately using addAvatar()
   */
  async create(data: CreateUserDto): Promise<User> {
    const { translations, images, ...rest } = data as any;

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        translations: this.prepareTranslations(translations),
        images: this.prepareImages(images),
      },
      include: {
        translations: true,
        images: true,
      },
    });

    return user;
  }

  /**
   * Update user with optional translations and images
   */
  async update(id: number, data: UpdateUserDto): Promise<User> {
    const { translations, images, ...rest } = data as any;

    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) throw new NotFoundException('USER_NOT_FOUND');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        translations: translations ? this.upsertTranslations(id, translations) : undefined,
        images: images ? this.upsertImages(images) : undefined,
      },
      include: {
        translations: true,
        images: true,
      },
    });
  }

  /**
   * Add avatar for a user
   */
  async addAvatar(userId: number, url: string) {
    return this.prisma.image.create({
      data: {
        url,
        type: 'AVATAR',
        entityType: 'USER',
        entityId: userId,
      },
    });
  }

  /**
   * Remove a user
   */
  async remove(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return this.prisma.user.delete({ where: { id } });
  }

  /** ----------------- Private helpers ----------------- */

  private getUserIncludes(lang?: string) {
    return {
      jobs: {
        include: {
          translations: lang ? { where: { lang } } : true,
          reviews: true,
          city: true,
          category: true,
        },
      },
      translations: lang ? { where: { lang } } : true,
      reviews: true,
      images: true,
    };
  }

  private prepareTranslations(translations: any[]) {
    return translations ? { create: translations.map((t) => ({ ...t })) } : undefined;
  }

  private prepareImages(images: any[]) {
    return images ? { create: images.map((img) => ({ ...img })) } : undefined;
  }

  private upsertTranslations(userId: number, translations: any[]) {
    return {
      upsert: translations.map((t) => ({
        where: { userId_lang: { userId, lang: t.lang } },
        create: { ...t },
        update: { ...t },
      })),
    };
  }

  private upsertImages(images: any[]) {
    return {
      upsert: images.map((img) => ({
        where: { id: img.id || 0 }, // replace 0 with unique identifier if possible
        create: { ...img },
        update: { ...img },
      })),
    };
  }
}
