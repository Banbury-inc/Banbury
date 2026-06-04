import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  async rewrites() {
    const tileHost = (
      process.env.NEXT_PUBLIC_RAINVIEWER_TILE_HOST || 'https://tilecache.rainviewer.com'
    ).replace(/\/$/, '')
    return [
      {
        source: '/rainviewer-tiles/:path*',
        destination: `${tileHost}/:path*`,
      },
    ]
  },
  async redirects() {
    return [
      // Redirect capitalized URLs to lowercase
      {
        source: '/Features',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/News',
        destination: '/news',
        permanent: true,
      },
      {
        source: '/Terms_of_use',
        destination: '/terms_of_use',
        permanent: true,
      },
      {
        source: '/Privacy_policy',
        destination: '/privacy_policy',
        permanent: true,
      },
      // Redirect non-existent pages to appropriate destinations
      {
        source: '/NeuraNet',
        destination: '/knowledge',
        permanent: true,
      },
      {
        source: '/Cloud',
        destination: '/',
        permanent: true,
      },
      {
        source: '/cloud',
        destination: '/',
        permanent: true,
      },
      {
        source: '/api',
        destination: '/api-docs',
        permanent: true,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true // Temporarily disable ESLint during builds to reduce memory usage
  },
  typescript: {
    ignoreBuildErrors: true // Temporarily disable TypeScript checking during builds to reduce memory usage
  },
  experimental: {
    // Reduce memory usage during build
    optimizePackageImports: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extensions', '@monaco-editor/react'],
    // Disable memory-intensive features
    optimizeCss: false,
    scrollRestoration: false,
    outputFileTracingIncludes: {
      '/api/assistant/langgraph-stream': [
        './pages/api/assistant/langgraph-stream/prompts/**/*.md',
      ],
    },
  },
  webpack: (config, { dev, isServer }) => {
    // Configure path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      'backend': path.resolve(__dirname, 'backend'),
      'frontend': path.resolve(__dirname, 'frontend'),
    };

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
            monaco: {
              test: /[\\/]node_modules[\\/]@monaco-editor[\\/]/,
              name: 'monaco',
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "banbury",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
