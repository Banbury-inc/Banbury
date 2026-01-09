// Type import removed to avoid missing module type declarations
import path from 'path'

const config = {
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions"
  ],
  typescript: {
    check: false,
    reactDocgen: false
  },
  docs: {
    autodocs: "tag"
  },
  core: {
    disableTelemetry: true,
    builder: {
      name: "@storybook/builder-vite",
      options: {
        viteConfigPath: undefined
      }
    }
  },
  features: {
    buildStoriesJson: true,
    storyStoreV7: true
  },
  viteFinal: async (config: any) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve?.alias || {}),
      "@": path.resolve(__dirname, "../frontend"),
      "frontend": path.resolve(__dirname, "../frontend"),
      "backend": path.resolve(__dirname, "../backend"),
      "next/router": path.resolve(__dirname, "./next-router-mock.js")
    }
    
    // Polyfill process.env for Next.js components (like Image)
    // Define process.env properties individually for proper replacement
    const processEnv = {
      NODE_ENV: 'development',
      NEXT_PUBLIC_JUPYTER_URL: '',
      NEXT_PUBLIC_API_BASE_URL: '',
    }
    
    config.define = {
      ...(config.define || {}),
      'process.env': JSON.stringify(processEnv),
      'process.env.NODE_ENV': JSON.stringify(processEnv.NODE_ENV),
      'process.env.NEXT_PUBLIC_JUPYTER_URL': JSON.stringify(processEnv.NEXT_PUBLIC_JUPYTER_URL),
      'process.env.NEXT_PUBLIC_API_BASE_URL': JSON.stringify(processEnv.NEXT_PUBLIC_API_BASE_URL),
    }
    
    // Add a plugin to inject process globally
    const existingPlugins = config.plugins || []
    config.plugins = [
      ...existingPlugins,
      {
        name: 'storybook-process-polyfill',
        configureServer(server: any) {
          server.middlewares.use((_req: any, _res: any, next: () => void) => {
            next()
          })
        },
        transformIndexHtml(html: string) {
          return html.replace(
            '<head>',
            `<head><script>
              if (typeof process === 'undefined') {
                window.process = {
                  env: ${JSON.stringify(processEnv)}
                }
              }
            </script>`
          )
        }
      }
    ]
    
    // Configure esbuild to handle TypeScript and JSX properly
    // Using react-jsx transform (no need for jsxInject)
    config.esbuild = {
      ...config.esbuild,
      jsx: 'automatic',
      jsxImportSource: 'react'
    }
    
    // Optimize dependencies
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: ['react', 'react-dom', '@storybook/react'],
      esbuildOptions: {
        target: 'es2020',
        jsx: 'automatic',
        loader: {
          '.js': 'jsx',
          '.ts': 'tsx',
          '.tsx': 'tsx'
        }
      }
    }
    
    return config
  }
}

export default config


