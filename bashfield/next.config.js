/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  i18n: {
    locales: ['en', 'ar', 'ku'],
    defaultLocale: 'en',
  },
  reactStrictMode: true,
  webpack: (config) => {
    // Route all next-i18next imports to our shims
    config.resolve.alias['next-i18next'] = path.resolve(__dirname, 'lib/i18n-shim.js');
    config.resolve.alias['next-i18next/serverSideTranslations'] = path.resolve(
      __dirname,
      'lib/serverSideTranslations-shim.js'
    );
    return config;
  },
};

module.exports = nextConfig;
