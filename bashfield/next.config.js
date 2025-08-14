const { i18n } = require('./next-i18next.config.js')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  images: {
    domains: ['txytcxselephovrtryuv.supabase.co'],
  },
  trailingSlash: false,
  experimental: {
    esmExternals: false
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Language',
            value: 'en,ku,ar'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
