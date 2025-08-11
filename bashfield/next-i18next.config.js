// next-i18next.config.js
module.exports = {
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
}
