/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SIN output: 'standalone' — Hostinger no lo necesita

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['lucide-react'],
  experimental: {
    serverActions: { allowedOrigins: ['growicrm.site'] },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}

module.exports = nextConfig