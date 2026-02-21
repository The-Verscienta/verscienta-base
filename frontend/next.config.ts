import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Instrumentation hook is enabled by default in Next.js 15
  // See instrumentation.ts for env validation at startup

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/sites/default/files/**',
      },
      {
        protocol: 'https',
        hostname: 'backend.ddev.site',
        pathname: '/sites/default/files/**',
      },
      {
        protocol: 'https',
        hostname: 'backend.verscienta.com',
        pathname: '/sites/default/files/**',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        pathname: '/**',
      },
    ],
  },

  // Enable compression
  compress: true,

  // Environment variables available at runtime
  env: {
    NEXT_PUBLIC_DRUPAL_BASE_URL: process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'http://localhost:8080',
    DRUPAL_CLIENT_ID: process.env.DRUPAL_CLIENT_ID || '',
    DRUPAL_CLIENT_SECRET: process.env.DRUPAL_CLIENT_SECRET || '',
    XAI_API_KEY: process.env.XAI_API_KEY || '',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Type checking and linting
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Security headers are handled by middleware.ts for dynamic nonce support
  // Static cache headers can still be defined here for specific routes
  async headers() {
    return [
      {
        // Cache static assets
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache fonts
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache Next.js static chunks
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);