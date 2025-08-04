const { i18n } = require('./next-i18next.config.js')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  images: {
    domains: ['[YOUR-ACTUAL-SUPABASE-URL]'],
  },
}

module.exports = nextConfig