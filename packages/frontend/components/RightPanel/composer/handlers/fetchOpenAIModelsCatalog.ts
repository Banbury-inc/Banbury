import { formatOpenAIModelDisplayName } from "../../../../utils/openAIChatModelId"
import type { ModelConfig } from "./getModelDisplayName"
import { setOpenAIModelsCatalog } from "./getModelDisplayName"

export interface OpenAIModelApiRow {
  id: string
  created?: number
  ownedBy?: string
}

let cachedModels: ModelConfig[] | null = null
let inflight: Promise<ModelConfig[]> | null = null

export function fetchOpenAIModelsCatalog(): Promise<ModelConfig[]> {
  if (cachedModels) return Promise.resolve(cachedModels)
  if (inflight) return inflight

  inflight = (async () => {
    const res = await fetch("/api/assistant/openai-models")
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(typeof err.error === "string" ? err.error : "Failed to load OpenAI models")
    }
    const data = (await res.json()) as { models: OpenAIModelApiRow[] }
    const configs: ModelConfig[] = data.models.map((m) => ({
      id: m.id,
      name: formatOpenAIModelDisplayName(m.id),
      provider: "openai" as const,
    }))
    setOpenAIModelsCatalog(configs)
    cachedModels = configs
    return configs
  })()

  return inflight.finally(() => {
    inflight = null
  })
}
