import { CONFIG } from '../../../config/config'

interface UserInfo {
  username: string
  email?: string
  first_name?: string
  last_name?: string
  picture?: any
  phone_number?: string
  auth_method?: string
}

interface ToastFunction {
  (options: {
    title: string
    description: string
    variant: 'success' | 'destructive'
  }): void
}

interface GenerateImageOptions {
  prompt: string
  size?: '256x256' | '512x512' | '1024x1024'
  model?: string
  fileBaseName?: string
  folder?: string
}

const uploadToS3 = async (
  file: File | Blob,
  deviceName: string,
  filePath: string = '',
  fileParent: string = ''
): Promise<any> => {
  const token = localStorage.getItem('authToken')
  const apiKey = localStorage.getItem('apiKey')

  if (!token) throw new Error('Authentication token not found. Please login first.')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('device_name', deviceName)
  formData.append('file_path', filePath)
  formData.append('file_parent', fileParent)

  const response = await fetch(`${CONFIG.url}/files/upload_to_s3/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
    body: formData,
  })

  if (!response.ok) {
    if (response.status === 413) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `STORAGE_LIMIT_EXCEEDED: ${
          (errorData as any).message || 'Storage limit exceeded. Please subscribe to Pro plan for unlimited storage.'
        }`
      )
    }
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

export async function handleCreateImage(
  userInfo: UserInfo | null,
  setUploading: (uploading: boolean) => void,
  toast: ToastFunction,
  triggerSidebarRefresh: () => void,
  options: GenerateImageOptions
) {
  if (!userInfo?.username) return

  const { prompt, size = '1024x1024', model, fileBaseName, folder = 'images' } = options

  if (!prompt || prompt.trim().length === 0) {
    toast({ title: 'Missing prompt', description: 'Please provide an image prompt.', variant: 'destructive' })
    return
  }

  setUploading(true)

  try {
    const resp = await fetch('/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size, model }),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(text || 'Failed to generate image')
    }

    const { imageBase64, revisedPrompt } = (await resp.json()) as { imageBase64: string; revisedPrompt?: string }

    const binary = atob(imageBase64)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)

    const blob = new Blob([bytes], { type: 'image/png' })

    const baseName = fileBaseName && fileBaseName.trim().length > 0 ? fileBaseName.trim() : 'Generated Image'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `${baseName} ${timestamp}.png`

    await uploadToS3(blob, userInfo.username, fileName, '')

    toast({
      title: 'Image created successfully',
      description: revisedPrompt ? `${fileName} uploaded. Prompt refined.` : `${fileName} uploaded.`,
      variant: 'success',
    })

    triggerSidebarRefresh()
  } catch (error) {
    if (error instanceof Error && error.message.includes('STORAGE_LIMIT_EXCEEDED')) {
      toast({
        title: 'Storage limit exceeded',
        description: 'You have exceeded the 10GB storage limit. Please subscribe to Pro plan for unlimited storage.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Failed to create image',
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    }
  } finally {
    setUploading(false)
  }
}


