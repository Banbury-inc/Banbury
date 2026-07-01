const defaultTemperatureOnlyOpenAIModelPrefixes = ["gpt-5"]

/** Models that return 400 if temperature, top_p, or top_k are set to non-default values. */
const anthropicModelsWithoutSamplingParams = [
  "claude-sonnet-5",
  "claude-opus-4-7",
  "claude-opus-4-8",
  "claude-fable-5",
] as const

export function anthropicModelRejectsSamplingParams(modelId: string): boolean {
  return anthropicModelsWithoutSamplingParams.some(
    (prefix) => modelId === prefix || modelId.startsWith(`${prefix}-`),
  )
}

export function getOpenAITemperatureOptions(modelId: string) {
  const usesDefaultTemperature = defaultTemperatureOnlyOpenAIModelPrefixes.some((prefix) =>
    modelId.startsWith(prefix)
  )

  if (usesDefaultTemperature) return {}

  return { temperature: 0.2 }
}

export function getAnthropicChatModelOptions(modelId: string, temperature = 0.2) {
  if (anthropicModelRejectsSamplingParams(modelId)) return {}

  return {
    temperature,
    invocationKwargs: { top_p: undefined },
  }
}
