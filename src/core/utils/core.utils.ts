export function normalizeEnum<T extends Record<string, string>>(
  value: string | undefined,
  enumType: T,
): T[keyof T] | undefined {
  if (!value) return undefined;
  const upper = value.trim().toUpperCase();
  return Object.values(enumType).includes(upper as T[keyof T])
    ? (upper as T[keyof T])
    : undefined;
}
/**
 * Removes specified keys from an object (shallow).
 * Useful for cleaning Prisma results before returning.
 */
export function excludeFields<T extends Record<string, any>>(
  obj: T,
  exclude: string[],
): Partial<T> {
  if (!obj) return obj;
  const clone = { ...obj };
  for (const key of exclude) {
    if (key in clone) delete clone[key];
  }
  return clone;
}
export function deepExclude(obj: any, exclude: string[]): any {
  if (Array.isArray(obj)) return obj.map((i) => deepExclude(i, exclude));
  if (obj && typeof obj === 'object') {
    const clean: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!exclude.includes(k)) clean[k] = deepExclude(v, exclude);
    }
    return clean;
  }
  return obj;
}
