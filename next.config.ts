import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@heroicons/react',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'cdn.hashnode.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Добавьте здесь домены ваших изображений
    ],
    // Оптимизация изображений для production
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Включить prefetching для ускорения переходов между страницами
  trailingSlash: false,
  // Оптимизации для production
  compress: true,
  poweredByHeader: false,
  // Оптимизации для уменьшения размера сборки
  webpack(config, { isServer }) {
    // Оптимизация импортов
    config.resolve.fallback = { ...(config.resolve.fallback || {}), fs: false };

    // Оптимизация для production
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk для больших библиотек
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Общий chunk для переиспользуемого кода
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;