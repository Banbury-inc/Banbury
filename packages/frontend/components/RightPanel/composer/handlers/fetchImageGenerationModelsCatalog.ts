import {
  setImageGenerationModelsCatalog,
  type MediaModelConfig,
} from "./getMediaModelDisplayName"

export interface MediaModelApiRow {
  id: string
  name: string
  provider: MediaModelConfig["provider"]
  kind: MediaModelConfig["kind"]
  description?: string
}

let cachedModels: MediaModelConfig[] | null = null
let inflight: Promise<MediaModelConfig[]> | null = null

export function fetchImageGenerationModelsCatalog(): Promise<MediaModelConfig[]> {
  if (cachedModels) return Promise.resolve(cachedModels)
  if (inflight) return inflight

  inflight = (async () => {
    const res = await fetch("/api/assistant/image-generation-models")
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(typeof err.error === "string" ? err.error : "Failed to load image generation models")
    }

    const data = (await res.json()) as { models?: MediaModelApiRow[] }
    const rows = Array.isArray(data.models) ? data.models : []
    const configs: MediaModelConfig[] = rows.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      kind: model.kind,
      description: model.description,
    }))

    setImageGenerationModelsCatalog(configs)
    cachedModels = configs
    return configs
  })()

  return inflight.finally(() => {
    inflight = null
  })
}
