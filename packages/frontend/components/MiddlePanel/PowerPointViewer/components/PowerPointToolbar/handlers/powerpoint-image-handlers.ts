import { ApiService } from '../../../../../../../backend/api/apiService'

/**
 * Convert a File object to a data URL
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Fetch a web image via our proxy API and return as data URL
 */
export async function resolveWebImageToDataUrl(url: string): Promise<string> {
  const response = await fetch('/api/images/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `Failed to fetch image: HTTP ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.success || !data.dataUrl) {
    throw new Error(data.error || 'Failed to fetch image')
  }

  return data.dataUrl
}

/**
 * Download a Google Drive image and convert to data URL
 */
export async function resolveDriveImageToDataUrl(fileId: string): Promise<string> {
  const blob = await ApiService.Drive.getFileBlob(fileId)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read Drive image'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Download an S3 image and convert to data URL
 */
export async function resolveS3ImageToDataUrl(fileId: string, fileName: string): Promise<string> {
  const result = await ApiService.downloadFromS3(fileId, fileName)
  
  if (!result.success || !result.blob) {
    throw new Error('Failed to download S3 image')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read S3 image'))
    reader.readAsDataURL(result.blob)
  })
}

/**
 * Prompt user to select a local image file and return as data URL
 */
export function handleLocalImageUpload(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const dataUrl = await fileToDataUrl(file)
          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      } else {
        reject(new Error('No file selected'))
      }
    }
    input.oncancel = () => reject(new Error('File selection cancelled'))
    input.click()
  })
}

