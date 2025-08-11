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
    ignoreBuildErrors: false
  },
  experimental: {
    // Reduce memory usage during build
    optimizePackageImports: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extensions'],
    // Disable some features that consume memory
    serverComponentsExternalPackages: ['@tiptap/react'],
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
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            tiptap: {
              test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
              name: 'tiptap',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }

    // Increase memory limit for webpack
    config.infrastructureLogging = {
      level: 'error',
    };

    return config;
  },
  // Increase memory allocation for the build process
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;


