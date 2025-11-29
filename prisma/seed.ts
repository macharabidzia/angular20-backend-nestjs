import {
  PrismaClient,
  RoleName,
  Permission as PermissionModel,
  Role as RoleModel,
} from '@prisma/client';

const prisma = new PrismaClient();

// ------------------------------------------------------
// 1) PERMISSIONS / ROLES CONFIG
// ------------------------------------------------------
const PERMISSION_CODES = [
  'jobs:create',
  'jobs:edit',
  'jobs:delete',
  'jobs:view',
  'users:list',
  'users:ban',
  'users:editRole',
] as const;

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  [RoleName.ADMIN]: [...PERMISSION_CODES],
  [RoleName.USER]: ['jobs:view'],
  [RoleName.HR]: ['jobs:view', 'jobs:create', 'jobs:edit'],
  [RoleName.MODERATOR]: ['jobs:view', 'jobs:edit', 'jobs:delete'],
};

// ------------------------------------------------------
// 2) COUNTRIES & CITIES DATA
// ------------------------------------------------------
const COUNTRIES = [
  {
    code: 'GE',
    translations: [
      { lang: 'en', name: 'Georgia' },
      { lang: 'ka', name: 'საქართველო' },
    ],
    cities: [
      {
        key: 'tbilisi',
        translations: [
          { lang: 'en', name: 'Tbilisi' },
          { lang: 'ka', name: 'თბილისი' },
        ],
      },
      {
        key: 'batumi',
        translations: [
          { lang: 'en', name: 'Batumi' },
          { lang: 'ka', name: 'ბათუმი' },
        ],
      },
    ],
  },
  {
    code: 'US',
    translations: [{ lang: 'en', name: 'United States' }],
    cities: [
      {
        key: 'nyc',
        translations: [{ lang: 'en', name: 'New York' }],
      },
      {
        key: 'sf',
        translations: [{ lang: 'en', name: 'San Francisco' }],
      },
    ],
  },
];

// ------------------------------------------------------
// 3) CATEGORIES
// ------------------------------------------------------
const CATEGORIES = [
  {
    key: 'software-dev',
    translations: [
      { lang: 'en', name: 'Software Development' },
      { lang: 'ka', name: 'პროგრამირება' },
    ],
  },
  {
    key: 'design',
    translations: [
      { lang: 'en', name: 'Design' },
      { lang: 'ka', name: 'დიზაინი' },
    ],
  },
  {
    key: 'marketing',
    translations: [
      { lang: 'en', name: 'Marketing' },
      { lang: 'ka', name: 'მარკეტინგი' },
    ],
  },
];

// ------------------------------------------------------
// SEED HELPERS
// ------------------------------------------------------

// --- Permissions + Roles ---
async function seedPermissionsAndRoles() {
  console.log('➡️ Seeding permissions & roles...');

  const permissions: PermissionModel[] = [];

  for (const code of PERMISSION_CODES) {
    const p = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
    permissions.push(p);
  }

  const permByCode: Record<string, PermissionModel> = Object.fromEntries(
    permissions.map((p) => [p.code, p]),
  );

  const roles: RoleModel[] = [];

  for (const name of Object.values(RoleName)) {
    const r = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roles.push(r);
  }
  const roleByName: Record<RoleName, RoleModel> = {
    [RoleName.USER]: roles.find((r) => r.name === RoleName.USER)!,
    [RoleName.ADMIN]: roles.find((r) => r.name === RoleName.ADMIN)!,
    [RoleName.MODERATOR]: roles.find((r) => r.name === RoleName.MODERATOR)!,
    [RoleName.HR]: roles.find((r) => r.name === RoleName.HR)!,
  };

  for (const roleName of Object.values(RoleName)) {
    const role = roleByName[roleName];
    const codes = ROLE_PERMISSIONS[roleName];

    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          set: codes.map((c) => ({ id: permByCode[c].id })),
        },
      },
    });

    console.log(`   ✔ Role ${roleName} updated`);
  }

  return { permByCode, roleByName };
}

// --- Countries + Cities ---
async function seedCountriesAndCities() {
  console.log('➡️ Seeding countries & cities...');

  const countryByCode: Record<string, { id: number }> = {};
  const cityByKey: Record<string, { id: number; countryCode: string }> = {};

  for (const item of COUNTRIES) {
    const country = await prisma.country.upsert({
      where: { code: item.code },
      update: {},
      create: { code: item.code },
    });

    countryByCode[item.code] = { id: country.id };

    for (const t of item.translations) {
      await prisma.countryTranslation.upsert({
        where: { countryId_lang: { countryId: country.id, lang: t.lang } },
        update: { name: t.name },
        create: { countryId: country.id, lang: t.lang, name: t.name },
      });
    }

    // cities
    for (const cityObj of item.cities) {
      let city = await prisma.city.findFirst({
        where: {
          countryId: country.id,
          translations: {
            some: { lang: 'en', name: cityObj.translations[0].name },
          },
        },
      });

      if (!city) {
        city = await prisma.city.create({
          data: { countryId: country.id },
        });
      }

      cityByKey[cityObj.key] = { id: city.id, countryCode: item.code };

      for (const t of cityObj.translations) {
        await prisma.cityTranslation.upsert({
          where: { cityId_lang: { cityId: city.id, lang: t.lang } },
          update: { name: t.name },
          create: { cityId: city.id, lang: t.lang, name: t.name },
        });
      }
    }
  }

  return { countryByCode, cityByKey };
}

// --- Categories ---
async function seedCategories() {
  console.log('➡️ Seeding categories...');

  const categoryByKey: Record<string, { id: number }> = {};

  for (const item of CATEGORIES) {
    let category = await prisma.category.findFirst({
      where: {
        translations: { some: { lang: 'en', name: item.translations[0].name } },
      },
    });

    if (!category) {
      category = await prisma.category.create({ data: {} });
    }

    categoryByKey[item.key] = { id: category.id };

    for (const t of item.translations) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_lang: { categoryId: category.id, lang: t.lang } },
        update: { name: t.name },
        create: { categoryId: category.id, lang: t.lang, name: t.name },
      });
    }
  }

  return { categoryByKey };
}

// --- Default Admin User ---
async function seedAdminUser(roleByName: Record<RoleName, RoleModel>) {
  console.log('➡️ Seeding admin user...');

  const adminEmail = 'admin@example.com';
  const hashedPassword =
    '$2a$10$T7je7uADu0s5dNlGZ5s5IezB3t9Z2SicvBzWrzUTVyF1q7S1W5eA2'; // admin123

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin',
      username: 'admin',
      email: adminEmail,
      phone: '+995599000000',
      password: hashedPassword,
      isVerified: true,
      roleId: roleByName[RoleName.ADMIN].id,
    },
  });

  return admin;
}

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------
async function main() {
  console.log('🚀 Starting Prisma seed...');

  const { roleByName } = await seedPermissionsAndRoles();
  await seedCountriesAndCities();
  await seedCategories();
  await seedAdminUser(roleByName);

  console.log('✅ SEED COMPLETED SUCCESSFULLY');
}

main()
  .catch((e) => {
    console.error('❌ SEED ERROR', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
