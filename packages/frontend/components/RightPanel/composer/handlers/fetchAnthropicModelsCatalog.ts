import type { ModelConfig } from "./getModelDisplayName"
import { setAnthropicModelsCatalog } from "./getModelDisplayName"

export interface AnthropicModelApiRow {
  id: string
  displayName: string
  maxInputTokens?: number
  maxOutputTokens?: number
}

let cachedModels: ModelConfig[] | null = null
let inflight: Promise<ModelConfig[]> | null = null

export function fetchAnthropicModelsCatalog(): Promise<ModelConfig[]> {
  if (cachedModels) return Promise.resolve(cachedModels)
  if (inflight) return inflight

  inflight = (async () => {
    const res = await fetch("/api/assistant/anthropic-models")
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(typeof err.error === "string" ? err.error : "Failed to load Anthropic models")
    }
    const data = (await res.json()) as { models: AnthropicModelApiRow[] }
    const configs: ModelConfig[] = data.models.map((m) => ({
      id: m.id,
      name: m.displayName,
      provider: "anthropic" as const,
    }))
    const maxInput: Record<string, number> = {}
    for (const m of data.models) {
      if (typeof m.maxInputTokens === "number") maxInput[m.id] = m.maxInputTokens
    }
    setAnthropicModelsCatalog(configs, maxInput)
    cachedModels = configs
    return configs
  })()

  return inflight.finally(() => {
    inflight = null
  })
}
