import { Prisma, JobType, Experience } from '@prisma/client';
import { JobsQueryDto } from '../dto/jobs-query.dto';
import { normalizeEnum } from 'src/core/utils/core.utils';

export const buildJobsQuery = (
  query: JobsQueryDto,
): {
  where: Prisma.JobWhereInput;
  orderBy: Prisma.JobOrderByWithRelationInput[];
  skip: number;
  take: number;
} => {
  const where: Prisma.JobWhereInput = {
    isActive: true, // ✅ always fetch only active jobs
  };

  const lang = query.lang || 'en';

  // ─────────── ENUM FILTERS ───────────
  const typeEnum = normalizeEnum(query.type, JobType);
  if (typeEnum) where.type = typeEnum;

  if (query.jobTypes?.length) {
    const mapped = query.jobTypes
      .map((v) => normalizeEnum(v, JobType))
      .filter((v): v is JobType => Boolean(v));
    if (mapped.length) where.type = { in: mapped };
  }

  if (query.experience?.length) {
    const mapped = query.experience
      .map((v) => normalizeEnum(v, Experience))
      .filter((v): v is Experience => Boolean(v));
    if (mapped.length) where.experience = { in: mapped };
  }

  // ─────────── COUNTRY & CATEGORY ───────────
  if (query.countryId) {
    where.countryId = query.countryId;
  }

  if (query.cityId) {
    where.cityId = query.cityId;
  }

  // --- FIX: SANITIZE THE CATEGORY INPUT ---
  if (query.category?.length) {
    // 1. Filter out any "junk" values like null, undefined, or the string "undefined".
    const validCategories = query.category.filter(
      (cat) => cat !== null && cat !== undefined && cat !== 'undefined',
    );

    // 2. Only apply the 'where' clause if valid categories remain.
    if (validCategories.length > 0) {
      where.category = {
        is: {
          translations: {
            some: {
              name: { in: validCategories }, // Use the clean list
              lang: { in: [lang, 'en', 'ka'] },
            },
          },
        },
      };
    }
  }
  // --- END FIX ---

  // ─────────── BOOLEAN & RANGE ───────────
  if (typeof query.remote === 'boolean') where.isRemote = query.remote;

  if (query.salary) {
    const salaryFilters: Prisma.JobWhereInput[] = [];
    if (query.salary.min != null)
      salaryFilters.push({ salaryMin: { gte: query.salary.min } });
    if (query.salary.max != null)
      salaryFilters.push({ salaryMax: { lte: query.salary.max } });
    if (salaryFilters.length) where.AND = salaryFilters;
  }

  // ─────────── SEARCH ───────────
  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      {
        translations: {
          some: {
            title: { contains: search, mode: 'insensitive' },
            lang: { in: [lang, 'en', 'ka'] },
          },
        },
      },
      {
        translations: {
          some: {
            description: { contains: search, mode: 'insensitive' },
            lang: { in: [lang, 'en', 'ka'] },
          },
        },
      },
      {
        skills: { hasSome: search.toLowerCase().split(/\s+/).filter(Boolean) },
      },
    ];
  }

  // ─────────── SORTING & PAGINATION ───────────
  const allowedSortFields = [
    'postedAt',
    'salaryMin',
    'salaryMax',
    'createdAt',
  ] as const;
  type AllowedSortField = (typeof allowedSortFields)[number];

  const safeSort: AllowedSortField = allowedSortFields.includes(
    query.sort as AllowedSortField,
  )
    ? (query.sort as AllowedSortField)
    : 'postedAt';

  const safeOrder: Prisma.SortOrder =
    query.order && ['asc', 'desc'].includes(query.order)
      ? (query.order as Prisma.SortOrder)
      : 'desc';

  const orderBy: Prisma.JobOrderByWithRelationInput[] = [
    { [safeSort]: safeOrder },
  ];

  const take = Math.min(Math.max(query.limit ?? 10, 1), 100);
  const skip = Math.max(((query.page ?? 1) - 1) * take, 0);

  return { where, orderBy, skip, take };
};
