import type { ModelConfig } from '../../../RightPanel/composer/handlers/getModelDisplayName'

export function toggleVisibleModel(
  visibleModels: string[],
  modelId: string,
  checked: boolean,
): string[] {
  if (checked) {
    if (visibleModels.includes(modelId)) return visibleModels
    return [...visibleModels, modelId]
  }
  return visibleModels.filter((id) => id !== modelId)
}

export function countVisibleModelsForProvider(
  visibleModels: string[],
  providerModels: ModelConfig[],
): number {
  const providerIds = new Set(providerModels.map((model) => model.id))
  return visibleModels.filter((id) => providerIds.has(id)).length
}

export function formatVisibleModelsSummary(selectedCount: number, totalCount: number): string {
  if (totalCount === 0) return 'No models available'
  if (selectedCount === 0) return 'None selected'
  if (selectedCount === totalCount) return `All ${totalCount} selected`
  return `${selectedCount} of ${totalCount} selected`
}
