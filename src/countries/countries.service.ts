import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { selectTranslated } from 'src/core/utils/translation.util';

@Injectable()
export class CountriesService {
  private readonly logger = new Logger(CountriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /** ➕ Create */
  async create(dto: CreateCountryDto) {
    const country = await this.prisma.country.create({
      data: {
        code: dto.code,
        translations: { create: dto.translations },
      },
      include: {
        translations: true,
        cities: { include: { translations: true } },
      },
    });

    await this.invalidateCache();
    return this.flatten(country, dto.translations[0]?.lang || 'en');
  }

  /** 📄 Find all (cached + flattened) */
  async findAll(lang = 'en') {
    const cacheKey = `countries:${lang}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`🟢 Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`🔴 Cache miss for ${cacheKey}`);

    const countries = await this.prisma.country.findMany({
      include: {
        translations: true,
        cities: { include: { translations: true } },
      },
      orderBy: { id: 'asc' },
    });

    const localized = countries.map((c) => this.flatten(c, lang));
    await this.cache.set(cacheKey, JSON.stringify(localized), 60_000);
    await this.syncRedisStore(cacheKey, localized);
    return localized;
  }

  /** 📘 Find one (cached + flattened) */
  async findOne(id: number, lang = 'en') {
    const cacheKey = `country:${id}:${lang}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return JSON.parse(cached);

    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        translations: true,
        cities: { include: { translations: true } },
      },
    });
    if (!country) return null;

    const result = this.flatten(country, lang);
    await this.cache.set(cacheKey, JSON.stringify(result), 60_000);
    await this.syncRedisStore(cacheKey, result);
    return result;
  }

  /** ✏️ Update */
  async update(id: number, dto: UpdateCountryDto) {
    const updated = await this.prisma.country.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.translations && {
          translations: {
            upsert: dto.translations.map((t) => ({
              where: { countryId_lang: { countryId: id, lang: t.lang } },
              update: { name: t.name },
              create: { lang: t.lang, name: t.name },
            })),
          },
        }),
      },
      include: {
        translations: true,
        cities: { include: { translations: true } },
      },
    });

    await this.invalidateCache();
    return this.flatten(updated, dto.translations?.[0]?.lang || 'en');
  }

  /** ❌ Remove */
  async remove(id: number) {
    const deleted = await this.prisma.country.delete({ where: { id } });
    await this.invalidateCache();
    return deleted;
  }

  // ----------------------------------------------------------------------
  // 🏙️ Find all cities for a given country (cached + localized)
  // ----------------------------------------------------------------------
  async findCities(countryId: number, lang = 'en') {
    const cacheKey = `country:${countryId}:cities:${lang}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`🟢 Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`🔴 Cache miss for ${cacheKey}`);

    const cities = await this.prisma.city.findMany({
      where: { countryId },
      include: { translations: true },
      orderBy: { id: 'asc' },
    });

    const localized = cities.map((city) => {
      const c = selectTranslated(city, lang);
      return {
        id: city.id,
        name: c?.translation?.name ?? '—',
      };
    });

    await this.cache.set(cacheKey, JSON.stringify(localized), 60_000);
    await this.syncRedisStore(cacheKey, localized);
    return localized;
  }

  // ----------------------------------------------------------------------
  // 🧩 UTILITIES
  // ----------------------------------------------------------------------
  private flatten(country: any, lang: string) {
    const c = selectTranslated(country, lang);
    return {
      id: country.id,
      code: country.code,
      name: c?.translation?.name ?? '—',
      cities: (country.cities || []).map((city: any) => {
        const t = selectTranslated(city, lang);
        return { id: city.id, name: t?.translation?.name ?? '—' };
      }),
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
    const keys = await client.keys('country*');
    if (keys.length) await client.del(keys);
    this.logger.log(`🧹 Cleared ${keys.length} Redis country keys`);
  }

  private async syncRedisStore(key: string, value: any) {
    const redis = this.getRedisStore();
    if (!redis) return;
    await redis.set(key, JSON.stringify(value));
  }
}
