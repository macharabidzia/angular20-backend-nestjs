import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';
import { selectTranslated } from 'src/core/utils/translation.util';
import { buildJobsQuery } from './prisma/jobs-filter.util';
import { deepExclude } from 'src/core/utils/core.utils';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // ==========================================================================
  // 📦 FIND ALL JOBS (cached + translated + flattened)
  // ==========================================================================
  async findAll(query: JobsQueryDto) {
    const cacheKey = `jobs:${JSON.stringify(query)}`;
    const cached = await this.cache.get<string>(cacheKey);

    if (cached) {
      this.logger.debug(`🟢 Cache hit for ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`🔴 Cache miss for ${cacheKey}`);

    const lang = query.lang || 'en';
    const { where, orderBy, skip, take } = buildJobsQuery(query);

    const [jobsRaw, totalItems] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: true,
          city: { include: { translations: { where: { lang } } } },
          category: { include: { translations: { where: { lang } } } },
          country: true,
          reviews: true,
          translations: { where: { lang } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    // 🟢 Flatten **full job object** + translated fields
    const data = jobsRaw.map((job) =>
      deepExclude(
        {
          ...job,
          ...selectTranslated(job, lang),
          category: selectTranslated(job.category, lang),
          city: selectTranslated(job.city, lang),
        },
        ['translations', 'reviews', 'user.password', 'user.email'],
      ),
    );

    const totalPages = Math.ceil(totalItems / take);

    const result = {
      data,
      totalItems,
      totalPages,
      page: query.page ?? 1,
      limit: take,
      hasNextPage: (query.page ?? 1) < totalPages,
      hasPrevPage: (query.page ?? 1) > 1,
    };

    await this.cache.set(cacheKey, JSON.stringify(result), 60_000);
    await this.syncRedisStore(cacheKey, result);

    return result;
  }

  // ==========================================================================
  // 📄 FIND ONE JOB (cached + translated + flattened)
  // ==========================================================================
  async findOne(id: number, lang = 'en') {
    const cacheKey = `job:${id}:${lang}`;
    const cached = await this.cache.get<string>(cacheKey);

    if (cached) {
      this.logger.debug(`🟢 Cache hit for job ${id}`);
      return JSON.parse(cached);
    }

    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        user: true,
        city: { include: { translations: { where: { lang } } } },
        category: { include: { translations: { where: { lang } } } },
        country: true,
        reviews: true,
        translations: { where: { lang } },
      },
    });

    if (!job) return null;

    // 🟢 FIX: spread full job object instead of only translated fields
    const flattened = deepExclude(
      {
        ...job,
        ...selectTranslated(job, lang),
        category: selectTranslated(job.category, lang),
        city: selectTranslated(job.city, lang),
      },
      ['translations', 'reviews', 'user.password', 'user.email'],
    );

    await this.cache.set(cacheKey, JSON.stringify(flattened), 60_000);
    await this.syncRedisStore(cacheKey, flattened);
    return flattened;
  }

  // ==========================================================================
  // ➕ CREATE JOB (translations only)
  // ==========================================================================
  async create(data: CreateJobDto) {
    const { translations, ...core } = data;

    const created = await this.prisma.job.create({
      data: {
        ...core,
        translations: {
          create: translations.map((t) => ({ ...t })),
        },
      },
    });

    await this.invalidateCache();
    return this.findOne(created.id);
  }

  // ==========================================================================
  // ✏️ UPDATE JOB
  // ==========================================================================
  async update(id: number, dto: UpdateJobDto) {
    const { translations, ...core } = dto;

    await this.prisma.job.update({
      where: { id },
      data: {
        ...core,
        ...(translations
          ? {
              translations: {
                upsert: translations.map((t) => ({
                  where: { jobId_lang: { jobId: id, lang: t.lang } },
                  update: t,
                  create: { ...t, jobId: id },
                })),
              },
            }
          : {}),
      },
    });

    await this.invalidateCache();
    return this.findOne(id);
  }

  // ==========================================================================
  // ❌ DELETE JOB
  // ==========================================================================
  async remove(id: number) {
    const deleted = await this.prisma.job.delete({ where: { id } });
    await this.invalidateCache();
    return deepExclude(deleted, ['translations']);
  }

  // ==========================================================================
  // ⚙️ CACHE UTILITIES
  // ==========================================================================
  private async invalidateCache() {
    const redisStore = this.getRedisStore();
    if (!redisStore) return;

    const client = redisStore.client;
    try {
      const keys = await client.keys('job*');
      if (keys.length > 0) {
        await client.del(keys);
        this.logger.log(`🧹 Cleared ${keys.length} Redis job keys`);
      }
    } catch (err: any) {
      this.logger.error(`❌ Redis key cleanup failed: ${err.message}`);
    }
  }

  private getRedisStore(): any | null {
    const stores = (this.cache as any)?.stores;
    if (!Array.isArray(stores)) return null;
    return stores.find((s: any) => s._store?.constructor?.name === 'KeyvRedis')
      ?._store;
  }

  private async syncRedisStore(key: string, value: any) {
    const redisStore = this.getRedisStore();
    if (!redisStore) return;
    try {
      await redisStore.set(key, JSON.stringify(value));
    } catch (err: any) {
      this.logger.error(`❌ Redis sync failed: ${err.message}`);
    }
  }
}
