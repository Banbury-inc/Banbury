export type ModelProvider = "anthropic" | "openai"

export interface ModelConfig {
  id: string
  name: string
  provider: ModelProvider
  description?: string
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI Models
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    description: "Most capable OpenAI model",
  },
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
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "Previous generation flagship model",
  },
  {
    id: "o1",
    name: "o1",
    provider: "openai",
    description: "Reasoning model for complex tasks",
  },
  {
    id: "o1-mini",
    name: "o1 Mini",
    provider: "openai",
    description: "Faster reasoning model",
  },
  // Anthropic Models
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "Most capable Claude model",
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
  return models[0]?.id || (provider === "openai" ? "gpt-4o-mini" : "claude-sonnet-4-20250514")
}

