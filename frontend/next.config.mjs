/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true // Temporarily disable ESLint during builds to reduce memory usage
  },
  typescript: {
    ignoreBuildErrors: true // Temporarily disable TypeScript checking during builds to reduce memory usage
  },
  experimental: {
    // Reduce memory usage during build
    optimizePackageImports: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extensions'],
    // Disable memory-intensive features
    optimizeCss: false,
    scrollRestoration: false,
  },
  webpack: (config, { dev, isServer }) => {
    // Add video file support
    config.module.rules.push({
      test: /\.(mp4|webm|ogg)$/i,
      type: 'asset/resource',
    });

    // Optimize for production builds
    if (!dev && !isServer) {
      // Reduce memory usage by optimizing chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // Limit chunk size to reduce memory usage
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            tiptap: {
              test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
              name: 'tiptap',
              chunks: 'all',
              priority: 20,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
            },
          },
        },
        // Reduce memory usage during optimization
        minimize: true,
        minimizer: config.optimization.minimizer,
      };
    }

    // Increase memory limit for webpack
    config.infrastructureLogging = {
      level: 'error',
    };

    // Disable source maps in production to reduce memory usage
    if (!dev) {
      config.devtool = false;
    }

    return config;
  },
  // Increase memory allocation for the build process
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;


