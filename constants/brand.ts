/**
 * Assamese ONLY for brand name + greeting.
 * কাছন ঘৰ = ক + া + ছ + ন + space + ঘ + ৰ
 * Uses Assamese ৰ (U+09F0). Rebuild stamp helps confirm cache cleared.
 */
const KA = '\u0995\u09BE'; // কা
const SON = '\u099B\u09A8'; // ছন
const GHAR = '\u0998\u09F0'; // ঘৰ
const NAME_AS = `${KA}${SON} ${GHAR}`;

export const brand = {
  nameEn: 'Kason Ghar',
  nameAs: NAME_AS,
  /** Split parts if a device font drops matra/spaces */
  nameAsParts: { ka: KA, son: SON, ghar: GHAR } as const,
  taglineEn: 'Traditional Assamese Weaves',
  productEn: 'Mekhela Chador',
  welcomeAs: '\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE', // স্বাগতম
  loginSubtitleEn: 'Mekhela Chador ERP · Inventory · Accounts',
  a11yLogo: `${NAME_AS} — Traditional Assamese Weaves`,
  /** Bump when forcing clients off stale Expo Go cache */
  bundleStamp: 'as-fix-2026-03-18b',
} as const;
