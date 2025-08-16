/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'ar', 'ku'],
    defaultLocale: 'en',
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
