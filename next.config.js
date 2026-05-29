/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'norjvtaujxlbdbqgkmwd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'sjxepisvuthynvixpwii.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
    // Optimize image formats
    formats: ['image/avif', 'image/webp'],
    // Add allowed quality values.
    // ВАЖНО: next/image применяет q=N только если N есть в этом списке,
    // иначе тихо откатывается к дефолту (75). Значения 80/90/95 используются
    // галереей товара и миниатюрами — без них фото отдавались хуже задуманного.
    qualities: [25, 50, 60, 75, 80, 85, 90, 95, 100],
    // Better caching for mobile
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    // 2560/3840 — под полноэкранный зум на retina/4K экранах.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable optimization
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },
  // Expose only necessary env vars to server
  env: {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
  },
  serverExternalPackages: ['pg', 'drizzle-orm'],
  // Compress responses
  compress: true,
  // Reduce bundle size by removing source maps in production
  productionBrowserSourceMaps: false,
  // Experimental optimizations
  experimental: {
    // Optimize package imports for large icon/component libraries
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
};

module.exports = nextConfig;
