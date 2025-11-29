type TranslationRecord = {
  lang: string;
  name?: string;
  title?: string;
  description?: string;
};

export function selectTranslated<
  T extends { translations?: TranslationRecord[] },
>(
  obj: T | null | undefined,
  lang: string,
):
  | (Omit<T, 'translations'> & { translation: TranslationRecord | null })
  | null {
  if (!obj) return null;

  const translation =
    obj.translations?.find((t) => t.lang === lang) ||
    obj.translations?.[0] ||
    null;

  // ✅ clone object *without* translations key
  const { translations, ...rest } = obj;
  const cleanObj = { ...rest } as Omit<T, 'translations'>;

  // ✅ ensure translations key is removed at runtime
  if ('translations' in cleanObj) {
    delete (cleanObj as any).translations;
  }

  return { ...cleanObj, translation };
}
