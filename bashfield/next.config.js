// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'ar', 'ku'],
    defaultLocale: 'en'
    // Do NOT set localeDetection here. Leaving it out uses the default.
  },
};

module.exports = nextConfig;
