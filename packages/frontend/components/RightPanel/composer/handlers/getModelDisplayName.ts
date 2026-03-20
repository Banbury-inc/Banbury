import { isOpenAIChatModelId } from "../../../../utils/openAIChatModelId"

export type ModelProvider = "anthropic" | "openai" | "google"

export interface ModelConfig {
  id: string
  name: string
  provider: ModelProvider
  description?: string
}

let openaiModelsCache: ModelConfig[] = []
let anthropicModelsCache: ModelConfig[] = []
let googleModelsCache: ModelConfig[] = []
let anthropicMaxInputTokensById: Record<string, number> = {}
let googleMaxInputTokensById: Record<string, number> = {}
let catalogRevision = 0

const ANTHROPIC_DEFAULT_MODEL_ID = "claude-sonnet-4-20250514"

function bumpModelsCatalogRevision() {
  catalogRevision += 1
}

export function setOpenAIModelsCatalog(models: ModelConfig[]) {
  openaiModelsCache = models
  bumpModelsCatalogRevision()
}

export function setAnthropicModelsCatalog(models: ModelConfig[], maxInputById: Record<string, number>) {
  anthropicModelsCache = models
  anthropicMaxInputTokensById = maxInputById
  bumpModelsCatalogRevision()
}

export function setGoogleModelsCatalog(models: ModelConfig[], maxInputById: Record<string, number>) {
  googleModelsCache = models
  googleMaxInputTokensById = maxInputById
  bumpModelsCatalogRevision()
}

export function getModelsCatalogRevision(): number {
  return catalogRevision
}

/** @deprecated Use getModelsCatalogRevision — same value (shared revision for all dynamic catalogs). */
export function getAnthropicCatalogRevision(): number {
  return catalogRevision
}

export function getAvailableModels(): ModelConfig[] {
  return [...openaiModelsCache, ...anthropicModelsCache, ...googleModelsCache]
}

export function getAnthropicMaxInputTokensForModel(modelId: string): number | undefined {
  if (anthropicMaxInputTokensById[modelId] != null) return anthropicMaxInputTokensById[modelId]
  for (const [key, value] of Object.entries(anthropicMaxInputTokensById)) {
    if (modelId.startsWith(key) || key.startsWith(modelId)) return value
  }
  return undefined
}

export function getGoogleMaxInputTokensForModel(modelId: string): number | undefined {
  if (googleMaxInputTokensById[modelId] != null) return googleMaxInputTokensById[modelId]
  for (const [key, value] of Object.entries(googleMaxInputTokensById)) {
    if (modelId.startsWith(key) || key.startsWith(modelId)) return value
  }
  return undefined
}

export function normalizePersistedModelId(
  rawModelId: string,
  provider: ModelProvider,
  fallbackModelId: string,
): string {
  const found = getAvailableModels().find((m) => m.id === rawModelId)
  if (found) return found.id
  if (provider === "anthropic" && rawModelId.startsWith("claude-")) return rawModelId
  if (provider === "openai" && isOpenAIChatModelId(rawModelId)) return rawModelId
  if (provider === "google" && rawModelId.startsWith("gemini-")) return rawModelId
  return fallbackModelId
}

export function getModelById(modelId: string): ModelConfig | undefined {
  return getAvailableModels().find((m) => m.id === modelId)
}

export function getModelDisplayName(modelId: string): string {
  const model = getModelById(modelId)
  return model?.name || modelId
}

export function getModelsByProvider(provider: ModelProvider): ModelConfig[] {
  return getAvailableModels().filter((m) => m.provider === provider)
}

export function getDefaultModelForProvider(provider: ModelProvider): string {
  const models = getModelsByProvider(provider)
  if (models[0]) return models[0].id
  if (provider === "openai") return "gpt-4o-mini"
  if (provider === "google") return "gemini-1.5-pro"
  return ANTHROPIC_DEFAULT_MODEL_ID
}

export const PREFERRED_VISIBLE_OPENAI_IDS = [
  "gpt-5.2",
  "gpt-4o",
  "gpt-4o-mini",
  "o3",
  "o3-mini",
] as const

export const PREFERRED_VISIBLE_GOOGLE_IDS = [
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
] as const

/** Used when the API list is not available yet; intersected with API order when possible. */
export const PREFERRED_VISIBLE_ANTHROPIC_IDS = [
  "claude-opus-4-5-20251101",
  "claude-sonnet-4",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
] as const

const DEFAULT_OPENAI_VISIBLE_COUNT = 5

export function defaultVisibleOpenAIIdsFromApi(apiOrderedOpenAIIds: string[]): string[] {
  const intersection = PREFERRED_VISIBLE_OPENAI_IDS.filter((id) => apiOrderedOpenAIIds.includes(id))
  if (intersection.length) return intersection
  return apiOrderedOpenAIIds.slice(0, DEFAULT_OPENAI_VISIBLE_COUNT)
}

const DEFAULT_GOOGLE_VISIBLE_COUNT = 4

export function defaultVisibleGoogleIdsFromApi(apiOrderedGoogleIds: string[]): string[] {
  const intersection = PREFERRED_VISIBLE_GOOGLE_IDS.filter((id) => apiOrderedGoogleIds.includes(id))
  if (intersection.length) return intersection
  return apiOrderedGoogleIds.slice(0, DEFAULT_GOOGLE_VISIBLE_COUNT)
}

const DEFAULT_ANTHROPIC_VISIBLE_COUNT = 4

export function defaultVisibleAnthropicIdsFromApi(apiOrderedClaudeIds: string[]): string[] {
  const intersection = PREFERRED_VISIBLE_ANTHROPIC_IDS.filter((id) => apiOrderedClaudeIds.includes(id))
  if (intersection.length) return intersection
  return apiOrderedClaudeIds.slice(0, DEFAULT_ANTHROPIC_VISIBLE_COUNT)
}

export function getDefaultVisibleModels(
  apiOpenAIOrderedIds?: string[],
  apiOrderedClaudeIds?: string[],
  apiOrderedGoogleIds?: string[],
): string[] {
  const openai = apiOpenAIOrderedIds?.length
    ? defaultVisibleOpenAIIdsFromApi(apiOpenAIOrderedIds)
    : [...PREFERRED_VISIBLE_OPENAI_IDS]
  const google = apiOrderedGoogleIds?.length
    ? defaultVisibleGoogleIdsFromApi(apiOrderedGoogleIds)
    : [...PREFERRED_VISIBLE_GOOGLE_IDS]
  const anthropic = apiOrderedClaudeIds?.length
    ? defaultVisibleAnthropicIdsFromApi(apiOrderedClaudeIds)
    : [...PREFERRED_VISIBLE_ANTHROPIC_IDS]
  return [...openai, ...google, ...anthropic]
}

export const DEFAULT_VISIBLE_MODELS = getDefaultVisibleModels()
