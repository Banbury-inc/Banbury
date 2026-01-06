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

export function setVideoGenerationModel(
  currentPreferences: ComposerToolPreferences,
  modelId: string
): ComposerToolPreferences {
  return {
    ...currentPreferences,
    video_generation_model: modelId,
  }
}

export const VIDEO_GENERATION_MODELS = [
  { id: 'sora-2', name: 'Sora 2 (Latest)', description: 'Fast, good quality for rapid iteration' },
  { id: 'sora-2-pro', name: 'Sora 2 Pro (Latest)', description: 'Higher quality, more polished results' },
  { id: 'sora-2-2025-12-08', name: 'Sora 2 (Dec 2025)', description: 'December 2025 release' },
  { id: 'sora-2-2025-10-06', name: 'Sora 2 (Oct 2025)', description: 'October 2025 release' },
  { id: 'sora-2-pro-2025-10-06', name: 'Sora 2 Pro (Oct 2025)', description: 'October 2025 Pro release' },
  { id: 'veo-3.1-generate-preview', name: 'Google Veo 3.1', description: 'Latest Google video generation' },
  { id: 'veo-3.1-fast-generate-preview', name: 'Google Veo 3.1 Fast', description: 'Faster Google video generation' },
  { id: 'veo-3.0-generate-001', name: 'Google Veo 3.0', description: 'Google Veo 3.0 stable release' },
  { id: 'veo-2.0-generate-001', name: 'Google Veo 2.0', description: 'Google Veo 2.0 stable release' },
  { id: 'runway-gen3-alpha', name: 'Runway Gen-3 Alpha', description: 'High-quality, detailed video generation' },
  { id: 'runway-gen3-turbo', name: 'Runway Gen-3 Turbo', description: 'Faster video generation' },
  { id: 'luma-dream-machine', name: 'Luma Dream Machine', description: 'Fast, realistic video generation' },
] as const
