export type ModelProvider = "anthropic" | "openai" | "google"

export interface ModelConfig {
  id: string
  name: string
  provider: ModelProvider
  description?: string
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI Models - GPT-5.x series (latest)
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    description: "Latest flagship model with advanced reasoning",
  },
  {
    id: "gpt-5.2-pro",
    name: "GPT-5.2 Pro",
    provider: "openai",
    description: "Most capable GPT-5.2 variant for complex tasks",
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    description: "Efficient GPT-5 model for everyday tasks",
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "openai",
    description: "Lightweight GPT-5 model for fast responses",
  },
  // OpenAI Models - GPT-4.1 series
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    description: "Enhanced GPT-4 with improved coding and context",
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    description: "Efficient GPT-4.1 variant",
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "openai",
    description: "Fastest GPT-4.1 variant",
  },
  // OpenAI Models - GPT-4o series (keep existing)
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "High-intelligence flagship model",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Affordable and intelligent small model",
  },
  // OpenAI Models - o-series reasoning models
  {
    id: "o3",
    name: "o3",
    provider: "openai",
    description: "Advanced reasoning model for complex tasks",
  },
  {
    id: "o3-pro",
    name: "o3 Pro",
    provider: "openai",
    description: "Most capable o3 variant with extended compute",
  },
  {
    id: "o3-mini",
    name: "o3 Mini",
    provider: "openai",
    description: "Efficient reasoning model",
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    provider: "openai",
    description: "Fast, cost-efficient reasoning model",
  },
  {
    id: "o1",
    name: "o1",
    provider: "openai",
    description: "Reasoning model for complex tasks",
  },
  {
    id: "o1-pro",
    name: "o1 Pro",
    provider: "openai",
    description: "Enhanced o1 with more compute for better responses",
  },
  {
    id: "o1-mini",
    name: "o1 Mini",
    provider: "openai",
    description: "Faster reasoning model",
  },
  // Anthropic Models
  {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    description: "Most capable Claude model with advanced reasoning",
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "High-performance Claude model",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Previous generation flagship model",
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Fastest Claude model",
  },
  // Google Gemini Models
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash (Experimental)",
    provider: "google",
    description: "Latest experimental Gemini model with advanced capabilities",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "High-performance Gemini model for complex tasks",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    description: "Fast and efficient Gemini model",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "google",
    description: "Standard Gemini model",
  },
]

export function getModelById(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId)
}

export function getModelDisplayName(modelId: string): string {
  const model = getModelById(modelId)
  return model?.name || modelId
}

export function getModelsByProvider(provider: ModelProvider): ModelConfig[] {
  return AVAILABLE_MODELS.filter(m => m.provider === provider)
}

export function getDefaultModelForProvider(provider: ModelProvider): string {
  const models = getModelsByProvider(provider)
  if (models[0]) return models[0].id
  if (provider === "openai") return "gpt-4o-mini"
  if (provider === "google") return "gemini-1.5-pro"
  return "claude-sonnet-4-20250514"
}

