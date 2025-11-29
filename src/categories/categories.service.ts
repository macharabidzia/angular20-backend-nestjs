import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { selectTranslated } from 'src/core/utils/translation.util';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /** ➕ Create category */
  async create(dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        translations: { create: dto.translations ?? [] },
      },
      include: { translations: true },
    });

    await this.invalidateCache();

    // ✅ Safe fallback if translations missing
    const lang = dto.translations?.[0]?.lang ?? 'en';
    return this.flatten(category, lang);
  }

  /** 📄 Get all categories (optional lang + caching) */
  async findAll(lang = 'en') {
    const cacheKey = `categories:${lang}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`🟢 Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`🔴 Cache miss for ${cacheKey}`);

    const categories = await this.prisma.category.findMany({
      include: { translations: true },
      orderBy: { id: 'asc' },
    });

    const localized = categories.map((cat) => this.flatten(cat, lang));

    await this.cache.set(cacheKey, JSON.stringify(localized), 60_000);
    await this.syncRedisStore(cacheKey, localized);

    return localized;
  }

  /** 📘 Get single category (cached) */
  async findOne(id: number, lang = 'en') {
    const cacheKey = `category:${id}:${lang}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`🟢 Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`🔴 Cache miss for ${cacheKey}`);

    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!category) throw new NotFoundException('Category not found');

    const result = this.flatten(category, lang);
    await this.cache.set(cacheKey, JSON.stringify(result), 60_000);
    await this.syncRedisStore(cacheKey, result);

    return result;
  }

  /** ✏️ Update category */
  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        translations: dto.translations
          ? {
              upsert: dto.translations.map((t) => ({
                where: { categoryId_lang: { categoryId: id, lang: t.lang } },
                update: { name: t.name },
                create: { lang: t.lang, name: t.name },
              })),
            }
          : undefined, // ✅ safe conditional inclusion
      },
      include: { translations: true },
    });

    await this.invalidateCache();

    const lang = dto.translations?.[0]?.lang ?? 'en';
    return this.flatten(category, lang);
  }

  /** ❌ Delete category */
  async remove(id: number) {
    const deleted = await this.prisma.category.delete({ where: { id } });
    await this.invalidateCache();
    return deleted;
  }

  // --------------------------------------------------------------------------
  // 🧩 UTILITIES
  // --------------------------------------------------------------------------

  private flatten(category: any, lang: string) {
    const localized = selectTranslated(category, lang);
    return {
      id: category.id,
      translation: {
        lang,
        name: localized?.translation?.name ?? null, // fallback clarity
      },
    };
  }

  private getRedisStore(): any | null {
    const stores = (this.cache as any)?.stores;
    if (!Array.isArray(stores)) return null;
    return stores.find((s: any) => s._store?.constructor?.name === 'KeyvRedis')
      ?._store;
  }

  private async invalidateCache() {
    const redis = this.getRedisStore();
    if (!redis) return;
    const client = redis.client;
    const keys = await client.keys('category*');
    if (keys.length) await client.del(keys);
    this.logger.log(`🧹 Cleared ${keys.length} Redis category keys`);
  }

  private async syncRedisStore(key: string, value: any) {
    const redis = this.getRedisStore();
    if (!redis) return;
    await redis.set(key, JSON.stringify(value));
  }
}
