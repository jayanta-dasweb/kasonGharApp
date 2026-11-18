/**
 * Assamese ONLY for brand name + greeting.
 * কাছন ঘৰ = KA (ক+া) + ছন + ঘৰ — built from Unicode so fonts/matras do not drop.
 */
const NAME_AS =
  '\u0995\u09BE\u099B\u09A8 \u0998\u09F0'; // কাছন ঘৰ

export const brand = {
  nameEn: 'Kason Ghar',
  nameAs: NAME_AS,
  taglineEn: 'Traditional Assamese Weaves',
  productEn: 'Mekhela Chador',
  welcomeAs: '\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE', // স্বাগতম
  loginSubtitleEn: 'Mekhela Chador ERP · Inventory · Accounts',
  a11yLogo: `${NAME_AS} — Traditional Assamese Weaves`,
} as const;
