module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ku', 'ar'],
  },
  fallbackLng: 'en',
  debug: process.env.NODE_ENV === 'development',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  localePath: './public/locales',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
}
