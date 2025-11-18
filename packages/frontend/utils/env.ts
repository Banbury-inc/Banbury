interface EnvironmentVariables {
  // Server-side only variables
  OPENAI_API_KEY: string
  ANTHROPIC_API_KEY: string
  BROWSERBASE_API_KEY: string
  BROWSERBASE_PROJECT_ID: string
  ZEP_API_KEY: string
  TAVILY_API_KEY: string
  API_BASE_URL: string
  
  // Public variables (accessible in browser)
  NEXT_PUBLIC_JUPYTER_URL?: string
  NEXT_PUBLIC_API_BASE_URL?: string
}

function validateEnv(): EnvironmentVariables {
  const requiredVars = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY', 
    'BROWSERBASE_API_KEY',
    'BROWSERBASE_PROJECT_ID',
    'ZEP_API_KEY',
    'TAVILY_API_KEY',
    'API_BASE_URL'
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    BROWSERBASE_API_KEY: process.env.BROWSERBASE_API_KEY!,
    BROWSERBASE_PROJECT_ID: process.env.BROWSERBASE_PROJECT_ID!,
    ZEP_API_KEY: process.env.ZEP_API_KEY!,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY!,
    API_BASE_URL: process.env.API_BASE_URL!,
    NEXT_PUBLIC_JUPYTER_URL: process.env.NEXT_PUBLIC_JUPYTER_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  }
}

// Only validate on server-side
export const env = typeof window === 'undefined' ? validateEnv() : {} as EnvironmentVariables

// Helper function to get public environment variables
export function getPublicEnv() {
  return {
    NEXT_PUBLIC_JUPYTER_URL: process.env.NEXT_PUBLIC_JUPYTER_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  }
}
