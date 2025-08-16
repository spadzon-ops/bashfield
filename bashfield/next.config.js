// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'ar', 'ku'],
    defaultLocale: 'en',
    localeDetection: true,
  },
};

module.exports = nextConfig;
