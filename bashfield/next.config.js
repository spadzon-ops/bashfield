const { i18n } = require('./next-i18next.config.js')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    ...i18n,
    localeDetection: false, // Disable automatic locale detection
  },
  images: {
    domains: ['txytcxselephovrtryuv.supabase.co'],
  },
  trailingSlash: false,
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig
