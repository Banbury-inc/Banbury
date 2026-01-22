import { UserInfo } from '../types'
import { handleCreateImage } from './handleCreateImage'

interface ToastFunction {
  (options: {
    title: string
    description: string
    variant: 'success' | 'destructive'
  }): void
}

interface HandleGenerateImageParams {
  userInfo: UserInfo | null
  toast: ToastFunction
  triggerSidebarRefresh: () => void
}

export async function handleGenerateImage({
  userInfo,
  toast,
  triggerSidebarRefresh
}: HandleGenerateImageParams): Promise<void> {
  const prompt = window.prompt('Describe the image to generate') || ''
  if (!prompt.trim()) return
  
  // Get image generation model from tool preferences
  let imageModel = 'dall-e-3'
  try {
    const saved = localStorage.getItem('toolPreferences')
    if (saved) {
      const prefs = JSON.parse(saved)
      imageModel = prefs.image_generation_model || 'dall-e-3'
    }
  } catch {}
  
  await handleCreateImage(
    userInfo,
    toast,
    triggerSidebarRefresh,
    { prompt, size: '1024x1024', folder: 'images', model: imageModel }
  )
}
