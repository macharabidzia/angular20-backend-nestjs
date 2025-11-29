import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { selectTranslated } from 'src/core/utils/translation.util';

@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /** ➕ Create a city */
  async create(dto: CreateCityDto) {
    const city = await this.prisma.city.create({
      data: {
        countryId: dto.countryId,
        translations: { create: dto.translations },
      },
      include: {
        translations: true,
        country: { include: { translations: true } },
      },
    });

    await this.invalidateCache();
    return this.flatten(city, dto.translations[0]?.lang || 'en');
  }

  /** 📄 Get all cities (optional lang + caching) */
  async findAll(countryId?: number, lang = 'en') {
    const cacheKey = `cities:${countryId || 'all'}:${lang}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`🟢 Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`🔴 Cache miss for ${cacheKey}`);

    const where = countryId ? { countryId } : undefined;
    const cities = await this.prisma.city.findMany({
      where,
      include: {
        translations: true,
        country: { include: { translations: true } },
      },
      orderBy: { id: 'asc' },
    });

    const localized = cities.map((city) => this.flatten(city, lang));

    await this.cache.set(cacheKey, JSON.stringify(localized), 60_000);
    await this.syncRedisStore(cacheKey, localized);
    return localized;
  }

  /** 📘 Get single city by ID (cached) */
  async findOne(id: number, lang = 'en') {
    const cacheKey = `city:${id}:${lang}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`🟢 Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`🔴 Cache miss for ${cacheKey}`);

    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        translations: true,
        country: { include: { translations: true } },
      },
    });
    if (!city) return null;

    const result = this.flatten(city, lang);
    await this.cache.set(cacheKey, JSON.stringify(result), 60_000);
    await this.syncRedisStore(cacheKey, result);
    return result;
  }

  /** ✏️ Update city */
  async update(id: number, dto: UpdateCityDto) {
    const city = await this.prisma.city.update({
      where: { id },
      data: {
        ...(dto.countryId && { countryId: dto.countryId }),
        ...(dto.translations && {
          translations: {
            upsert: dto.translations.map((t) => ({
              where: { cityId_lang: { cityId: id, lang: t.lang } },
              update: { name: t.name },
              create: { lang: t.lang, name: t.name },
            })),
          },
        }),
      },
      include: {
        translations: true,
        country: { include: { translations: true } },
      },
    });

    await this.invalidateCache();
    return this.flatten(city, dto.translations?.[0]?.lang || 'en');
  }

  /** ❌ Remove city */
  async remove(id: number) {
    const deleted = await this.prisma.city.delete({ where: { id } });
    await this.invalidateCache();
    return deleted;
  }

  // --------------------------------------------------------------------------
  // 🧩 UTILITIES
  // --------------------------------------------------------------------------

  /** ✅ Flatten multi-language relations */
  private flatten(city: any, lang: string) {
    const c = selectTranslated(city, lang);
    const country = selectTranslated(city.country, lang);

    return {
      id: city.id,
      name: c?.translation?.name,
      country: {
        id: city.country.id,
        code: city.country.code,
        name: country?.translation?.name,
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
    const keys = await client.keys('city*');
    if (keys.length) await client.del(keys);
    this.logger.log(`🧹 Cleared ${keys.length} Redis city keys`);
  }

  private async syncRedisStore(key: string, value: any) {
    const redis = this.getRedisStore();
    if (!redis) return;
    await redis.set(key, JSON.stringify(value));
  }
}
