import type { ComposerToolPreferences } from '../Composer'

export function toggleToolPreference(
  currentPreferences: ComposerToolPreferences,
  toolKey: keyof ComposerToolPreferences,
  currentValue: boolean
): ComposerToolPreferences {
  return {
    ...currentPreferences,
    [toolKey]: !currentValue,
  }
}

export function setImageGenerationModel(
  currentPreferences: ComposerToolPreferences,
  modelId: string
): ComposerToolPreferences {
  return {
    ...currentPreferences,
    image_generation_model: modelId,
  }
}

export const IMAGE_GENERATION_MODELS = [
  { id: 'dall-e-3', name: 'DALL-E 3', description: 'Most capable, highest quality' },
  { id: 'dall-e-2', name: 'DALL-E 2', description: 'Faster, lower cost' },
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana', description: 'Google DeepMind image generation' },
] as const
