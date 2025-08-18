/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['txytcxselephovrtryuv.supabase.co'],
  },
  trailingSlash: false,
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig
