import type { ModelConfig } from "./getModelDisplayName"
import { setGoogleModelsCatalog } from "./getModelDisplayName"

export interface GoogleModelApiRow {
  id: string
  displayName: string
  description?: string
  maxInputTokens?: number
  maxOutputTokens?: number
}

let cachedModels: ModelConfig[] | null = null
let inflight: Promise<ModelConfig[]> | null = null

export function fetchGoogleModelsCatalog(): Promise<ModelConfig[]> {
  if (cachedModels) return Promise.resolve(cachedModels)
  if (inflight) return inflight

  inflight = (async () => {
    const res = await fetch("/api/assistant/google-models")
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as {
        error?: string
        details?: string
        googleStatus?: number
        requestId?: string
      }
      const parts = [
        typeof err.error === "string" ? err.error : "Failed to load Google models",
        err.googleStatus != null ? `HTTP ${err.googleStatus}` : "",
        typeof err.details === "string" ? err.details : "",
        typeof err.requestId === "string" ? `Request ID: ${err.requestId}` : "",
      ].filter(Boolean)
      throw new Error(parts.join(" — "))
    }
    const data = (await res.json()) as { models?: GoogleModelApiRow[] }
    const rows = Array.isArray(data.models) ? data.models : []
    const configs: ModelConfig[] = rows.map((m) => ({
      id: m.id,
      name: m.displayName,
      provider: "google" as const,
      description: m.description,
    }))
    const maxInput: Record<string, number> = {}
    for (const m of rows) {
      if (typeof m.maxInputTokens === "number") maxInput[m.id] = m.maxInputTokens
    }
    setGoogleModelsCatalog(configs, maxInput)
    cachedModels = configs
    return configs
  })()

  return inflight.finally(() => {
    inflight = null
  })
}
