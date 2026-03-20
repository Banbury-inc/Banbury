import { isOpenAIChatModelId } from "../../../../utils/openAIChatModelId"
import type { ModelConfig, ModelProvider } from "./getModelDisplayName"

const FALLBACK_CATALOG_LIMIT = 16

function visiblePrefsMentionProvider(visibleModels: string[], provider: ModelProvider): boolean {
  if (provider === "google") return visibleModels.some((id) => id.startsWith("gemini-"))
  if (provider === "anthropic") return visibleModels.some((id) => id.startsWith("claude-"))
  if (provider === "openai") return visibleModels.some((id) => isOpenAIChatModelId(id))
  return false
}

/**
 * Lists models for the dropdown. If saved visibleModels reference provider ids that no longer
 * exist in the fetched catalog (e.g. old static Gemini names), fall back to showing catalog entries
 * so the section is not empty.
 */
export function getModelsForSelectorSection(
  availableModels: ModelConfig[],
  visibleModels: string[],
  provider: ModelProvider,
): ModelConfig[] {
  const pool = availableModels.filter((m) => m.provider === provider)
  const picked = pool.filter((m) => visibleModels.includes(m.id))
  if (picked.length > 0) return picked

  if (
    pool.length > 0 &&
    visiblePrefsMentionProvider(visibleModels, provider) &&
    !visibleModels.some((id) => pool.some((m) => m.id === id))
  ) {
    return pool.slice(0, FALLBACK_CATALOG_LIMIT)
  }

  return []
}
