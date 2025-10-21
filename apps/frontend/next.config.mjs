/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Enable standalone build for Docker
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  typescript: {
    ignoreBuildErrors: true, // <--- ignora errori TypeScript in build
  },
  eslint: {
    ignoreDuringBuilds: true, // <--- ignora errori ESLint in build
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  // Proxy per sviluppo locale: /api -> localhost:3003/api
  async rewrites() {
    // Solo in development, fai proxy delle chiamate /api al backend su porta 3003
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3003/api/:path*',
        },
      ];
    }
    // In production (Docker), nginx gestisce il routing
    return [];
  },
};

export default nextConfig;