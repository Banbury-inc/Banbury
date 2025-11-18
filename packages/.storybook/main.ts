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
      "@": path.resolve(__dirname, "../src"),
      "next/router": path.resolve(__dirname, "./next-router-mock.js")
    }
    
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


