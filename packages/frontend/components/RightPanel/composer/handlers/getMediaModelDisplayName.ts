export type MediaModelKind = "image" | "video"
export type MediaModelProvider = "openai" | "google" | "runway" | "luma"

export interface MediaModelConfig {
  id: string
  name: string
  provider: MediaModelProvider
  kind: MediaModelKind
  description?: string
}

export const DEFAULT_IMAGE_GENERATION_MODEL_ID = "dall-e-3"
export const DEFAULT_VIDEO_GENERATION_MODEL_ID = "sora-2"

export const FALLBACK_IMAGE_GENERATION_MODELS: MediaModelConfig[] = [
  {
    id: "dall-e-3",
    name: "DALL-E 3",
    provider: "openai",
    kind: "image",
    description: "Most capable, highest quality",
  },
  {
    id: "dall-e-2",
    name: "DALL-E 2",
    provider: "openai",
    kind: "image",
    description: "Faster, lower cost",
  },
  {
    id: "gemini-2.5-flash-image",
    name: "Nano Banana",
    provider: "google",
    kind: "image",
    description: "Google DeepMind image generation",
  },
]

export const FALLBACK_VIDEO_GENERATION_MODELS: MediaModelConfig[] = [
  {
    id: "sora-2",
    name: "Sora 2 (Latest)",
    provider: "openai",
    kind: "video",
    description: "Fast, good quality for rapid iteration",
  },
  {
    id: "sora-2-pro",
    name: "Sora 2 Pro (Latest)",
    provider: "openai",
    kind: "video",
    description: "Higher quality, more polished results",
  },
  {
    id: "sora-2-2025-12-08",
    name: "Sora 2 (Dec 2025)",
    provider: "openai",
    kind: "video",
    description: "December 2025 release",
  },
  {
    id: "sora-2-2025-10-06",
    name: "Sora 2 (Oct 2025)",
    provider: "openai",
    kind: "video",
    description: "October 2025 release",
  },
  {
    id: "sora-2-pro-2025-10-06",
    name: "Sora 2 Pro (Oct 2025)",
    provider: "openai",
    kind: "video",
    description: "October 2025 Pro release",
  },
  {
    id: "veo-3.1-generate-preview",
    name: "Google Veo 3.1",
    provider: "google",
    kind: "video",
    description: "Latest Google video generation",
  },
  {
    id: "veo-3.1-fast-generate-preview",
    name: "Google Veo 3.1 Fast",
    provider: "google",
    kind: "video",
    description: "Faster Google video generation",
  },
  {
    id: "veo-3.0-generate-001",
    name: "Google Veo 3.0",
    provider: "google",
    kind: "video",
    description: "Google Veo 3.0 stable release",
  },
  {
    id: "veo-2.0-generate-001",
    name: "Google Veo 2.0",
    provider: "google",
    kind: "video",
    description: "Google Veo 2.0 stable release",
  },
  {
    id: "runway-gen3-alpha",
    name: "Runway Gen-3 Alpha",
    provider: "runway",
    kind: "video",
    description: "High-quality, detailed video generation",
  },
  {
    id: "runway-gen3-turbo",
    name: "Runway Gen-3 Turbo",
    provider: "runway",
    kind: "video",
    description: "Faster video generation",
  },
  {
    id: "luma-dream-machine",
    name: "Luma Dream Machine",
    provider: "luma",
    kind: "video",
    description: "Fast, realistic video generation",
  },
]

let imageModelsCache: MediaModelConfig[] = []
let videoModelsCache: MediaModelConfig[] = []
let mediaCatalogRevision = 0

function bumpMediaModelsCatalogRevision() {
  mediaCatalogRevision += 1
}

function mergeMediaModels(
  fallbackModels: MediaModelConfig[],
  dynamicModels: MediaModelConfig[],
): MediaModelConfig[] {
  const byId = new Map<string, MediaModelConfig>()
  for (const model of fallbackModels) byId.set(model.id, model)
  for (const model of dynamicModels) {
    if (!byId.has(model.id)) byId.set(model.id, model)
  }
  return [...byId.values()]
}

export function setImageGenerationModelsCatalog(models: MediaModelConfig[]) {
  imageModelsCache = mergeMediaModels(FALLBACK_IMAGE_GENERATION_MODELS, models)
  bumpMediaModelsCatalogRevision()
}

export function setVideoGenerationModelsCatalog(models: MediaModelConfig[]) {
  videoModelsCache = mergeMediaModels(FALLBACK_VIDEO_GENERATION_MODELS, models)
  bumpMediaModelsCatalogRevision()
}

export function getMediaModelsCatalogRevision(): number {
  return mediaCatalogRevision
}

export function getImageGenerationModels(): MediaModelConfig[] {
  return imageModelsCache.length ? imageModelsCache : FALLBACK_IMAGE_GENERATION_MODELS
}

export function getVideoGenerationModels(): MediaModelConfig[] {
  return videoModelsCache.length ? videoModelsCache : FALLBACK_VIDEO_GENERATION_MODELS
}

export function getDefaultImageGenerationModel(): string {
  const models = getImageGenerationModels()
  if (models.some((model) => model.id === DEFAULT_IMAGE_GENERATION_MODEL_ID)) {
    return DEFAULT_IMAGE_GENERATION_MODEL_ID
  }
  return models[0]?.id || DEFAULT_IMAGE_GENERATION_MODEL_ID
}

export function getDefaultVideoGenerationModel(): string {
  const models = getVideoGenerationModels()
  if (models.some((model) => model.id === DEFAULT_VIDEO_GENERATION_MODEL_ID)) {
    return DEFAULT_VIDEO_GENERATION_MODEL_ID
  }
  return models[0]?.id || DEFAULT_VIDEO_GENERATION_MODEL_ID
}

export function getMediaModelDisplayName(modelId: string): string {
  const model = [...getImageGenerationModels(), ...getVideoGenerationModels()].find(
    (candidate) => candidate.id === modelId,
  )
  return model?.name || modelId
}

function isKnownImageModelId(modelId: string): boolean {
  return modelId.startsWith("dall-e") || modelId.startsWith("gpt-image") || modelId.startsWith("gemini")
}

function isKnownVideoModelId(modelId: string): boolean {
  return (
    modelId.startsWith("sora") ||
    modelId.startsWith("veo") ||
    modelId.startsWith("runway") ||
    modelId.includes("luma")
  )
}

export function normalizePersistedImageGenerationModel(rawModelId: unknown): string {
  if (typeof rawModelId !== "string" || rawModelId.trim().length === 0) {
    return getDefaultImageGenerationModel()
  }
  if (getImageGenerationModels().some((model) => model.id === rawModelId)) return rawModelId
  if (isKnownImageModelId(rawModelId)) return rawModelId
  return getDefaultImageGenerationModel()
}

export function normalizePersistedVideoGenerationModel(rawModelId: unknown): string {
  if (typeof rawModelId !== "string" || rawModelId.trim().length === 0) {
    return getDefaultVideoGenerationModel()
  }
  if (getVideoGenerationModels().some((model) => model.id === rawModelId)) return rawModelId
  if (isKnownVideoModelId(rawModelId)) return rawModelId
  return getDefaultVideoGenerationModel()
}
