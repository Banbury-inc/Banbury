import type { ModelProvider } from "./getModelDisplayName"

// Context window sizes (in tokens) for each model
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  // OpenAI models
  "gpt-5": 128_000,
  "gpt-4o": 128_000,
  "gpt-4o-mini": 128_000,
  "gpt-4-turbo": 128_000,
  "o1": 200_000,
  "o1-mini": 200_000,
  // Anthropic models
  "claude-sonnet-4-20250514": 200_000,
  "claude-3-5-sonnet-20241022": 200_000,
  "claude-3-5-haiku-20241022": 200_000,
}

// Default context windows by provider (fallback)
const DEFAULT_CONTEXT_WINDOWS: Record<ModelProvider, number> = {
  openai: 128_000,
  anthropic: 200_000,
}

// Average characters per token varies by provider/language
// Claude tends to be ~3.5-4 chars/token for English, GPT ~4 chars/token
const CHARS_PER_TOKEN: Record<ModelProvider, number> = {
  openai: 4,
  anthropic: 3.8,
}

// Default output token reservation (matches defaultLangGraphConfig.maxTokens)
export const DEFAULT_OUTPUT_RESERVATION = 4096

interface GetModelContextWindowParams {
  modelId: string
  provider: ModelProvider
}

export function getModelContextWindowTokens({ modelId, provider }: GetModelContextWindowParams): number {
  // Check exact model id first
  if (MODEL_CONTEXT_WINDOWS[modelId]) {
    return MODEL_CONTEXT_WINDOWS[modelId]
  }
  
  // Check for partial match (e.g. "claude-3-5-sonnet" prefix)
  for (const [key, value] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (modelId.startsWith(key) || key.startsWith(modelId)) {
      return value
    }
  }
  
  // Fallback to provider default
  return DEFAULT_CONTEXT_WINDOWS[provider] || 128_000
}

interface EstimateTokensParams {
  threadMessages: Array<{ role: string; content: any[] | string }>
  draftText: string
  documentContextPreview: string
  provider: ModelProvider
  attachmentsSummary?: string
}

function extractTextFromContent(content: any[] | string): string {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  
  return content
    .map((part) => {
      if (typeof part === "string") return part
      if (part?.type === "text" && part?.text) return part.text
      if (part?.type === "tool-call") {
        // Include tool call args as rough estimate
        return JSON.stringify(part.args || {})
      }
      if (part?.type === "tool-result") {
        const result = part.result
        return typeof result === "string" ? result : JSON.stringify(result || {})
      }
      return ""
    })
    .join(" ")
}

export function estimateTokensForDraft({
  threadMessages,
  draftText,
  documentContextPreview,
  provider,
  attachmentsSummary = "",
}: EstimateTokensParams): number {
  const charsPerToken = CHARS_PER_TOKEN[provider] || 4
  
  // Estimate tokens from thread messages
  let totalChars = 0
  for (const msg of threadMessages) {
    const text = extractTextFromContent(msg.content)
    // Add role overhead (~10 tokens per message for role/formatting)
    totalChars += text.length + 40
  }
  
  // Add draft text
  totalChars += draftText.length
  
  // Add document context
  totalChars += documentContextPreview.length
  
  // Add attachments summary
  totalChars += attachmentsSummary.length
  
  // Add system prompt overhead estimate (~2000 chars)
  totalChars += 2000
  
  return Math.ceil(totalChars / charsPerToken)
}

interface ContextBudgetResult {
  contextWindowTokens: number
  reservedOutputTokens: number
  estimatedPromptTokens: number
  estimatedRemainingTokens: number
  usagePercent: number
}

interface ComputeContextBudgetParams {
  modelId: string
  provider: ModelProvider
  threadMessages: Array<{ role: string; content: any[] | string }>
  draftText: string
  documentContextPreview: string
  attachmentsSummary?: string
  outputReservation?: number
}

export function computeContextBudget({
  modelId,
  provider,
  threadMessages,
  draftText,
  documentContextPreview,
  attachmentsSummary = "",
  outputReservation = DEFAULT_OUTPUT_RESERVATION,
}: ComputeContextBudgetParams): ContextBudgetResult {
  const contextWindowTokens = getModelContextWindowTokens({ modelId, provider })
  const reservedOutputTokens = outputReservation
  
  const estimatedPromptTokens = estimateTokensForDraft({
    threadMessages,
    draftText,
    documentContextPreview,
    provider,
    attachmentsSummary,
  })
  
  const availableForPrompt = contextWindowTokens - reservedOutputTokens
  const estimatedRemainingTokens = Math.max(0, availableForPrompt - estimatedPromptTokens)
  const usagePercent = Math.min(100, (estimatedPromptTokens / availableForPrompt) * 100)
  
  return {
    contextWindowTokens,
    reservedOutputTokens,
    estimatedPromptTokens,
    estimatedRemainingTokens,
    usagePercent,
  }
}

// Format token count for display (e.g. 128000 -> "128k")
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) {
    const k = tokens / 1000
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
  }
  return String(tokens)
}

