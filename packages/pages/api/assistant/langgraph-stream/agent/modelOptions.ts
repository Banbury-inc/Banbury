const defaultTemperatureOnlyOpenAIModelPrefixes = ["gpt-5"]

export function getOpenAITemperatureOptions(modelId: string) {
  const usesDefaultTemperature = defaultTemperatureOnlyOpenAIModelPrefixes.some((prefix) =>
    modelId.startsWith(prefix)
  )

  if (usesDefaultTemperature) return {}

  return { temperature: 0.2 }
}
