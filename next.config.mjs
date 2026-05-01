/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['sqlite3'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://backend.vehix.ug/api/:path*',
      },
    ]
  },
}

export default nextConfig
