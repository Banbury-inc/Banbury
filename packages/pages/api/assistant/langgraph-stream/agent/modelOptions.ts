const defaultTemperatureOnlyOpenAIModelPrefixes = ["gpt-5"]

/** Models that return 400 if temperature, top_p, or top_k are set to non-default values. */
const anthropicModelsWithoutSamplingParams = [
  "claude-sonnet-5",
  "claude-opus-4-7",
  "claude-opus-4-8",
  "claude-fable-5",
] as const

/**
 * Models that reject `thinking.type: "disabled"` (the @langchain/anthropic default).
 * These models only accept adaptive thinking or `enabled` with a budget.
 */
const anthropicAdaptiveThinkingModelPrefixes = ["claude-fable-5"] as const

function matchesModelPrefix(modelId: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => modelId === prefix || modelId.startsWith(`${prefix}-`))
}

export function anthropicModelRejectsSamplingParams(modelId: string): boolean {
  return matchesModelPrefix(modelId, anthropicModelsWithoutSamplingParams)
}

export function anthropicModelRequiresAdaptiveThinking(modelId: string): boolean {
  return matchesModelPrefix(modelId, anthropicAdaptiveThinkingModelPrefixes)
}

export function getOpenAITemperatureOptions(modelId: string) {
  const usesDefaultTemperature = defaultTemperatureOnlyOpenAIModelPrefixes.some((prefix) =>
    modelId.startsWith(prefix)
  )

  if (usesDefaultTemperature) return {}

  return { temperature: 0.2 }
}

export function getAnthropicChatModelOptions(modelId: string, temperature = 0.2) {
  // @langchain/anthropic defaults to `thinking: { type: "disabled" }`, which these
  // models reject with a 400. Override via invocationKwargs (spread into the request
  // payload after `thinking`) since the SDK types don't yet include "adaptive".
  if (anthropicModelRequiresAdaptiveThinking(modelId))
    return { invocationKwargs: { thinking: { type: "adaptive" } } }

  if (anthropicModelRejectsSamplingParams(modelId)) return {}

  return {
    temperature,
    invocationKwargs: { top_p: undefined },
  }
}
