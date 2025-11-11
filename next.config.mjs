/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for performance
  experimental: {
    optimizePackageImports: ['@/components', '@/lib', '@/hooks'],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimizations
  webpack: (config, { isServer }) => {
    // Optimize chunk splitting for better caching
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Separate charts bundle for better caching
        charts: {
          name: 'charts',
          chunks: 'all',
          test: /[\\/]components[\\/]charts[\\/]/,
          priority: 20,
        },
        // Performance components bundle
        performance: {
          name: 'performance',
          chunks: 'all',
          test: /[\\/]components[\\/]performance[\\/]/,
          priority: 20,
        },
        // Utilities bundle
        utils: {
          name: 'utils',
          chunks: 'all',
          test: /[\\/](lib|hooks)[\\/]/,
          priority: 15,
        },
      };
    }
    
    // Web Worker support
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    });
    
    return config;
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Cache static assets
      {
        source: '/workers/:path*',
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

export default nextConfig;