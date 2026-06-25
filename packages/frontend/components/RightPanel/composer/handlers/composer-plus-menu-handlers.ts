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

export function setVideoGenerationModel(
  currentPreferences: ComposerToolPreferences,
  modelId: string
): ComposerToolPreferences {
  return {
    ...currentPreferences,
    video_generation_model: modelId,
  }
}
