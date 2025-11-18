export interface InsertImageParams {
  editor: any
  imageUrl: string
}

async function resolveImageUrlToUsableSrc(imageUrl: string): Promise<string | null> {
  const url = imageUrl.trim()
  if (!url.startsWith('http')) return null
  try {
    // Try a HEAD to see if it’s publicly accessible
    const head = await fetch(url, { method: 'HEAD' })
    if (head.ok) return url
  } catch {}

  // Fallback: try GET with credentials for presigned/protected links, then create blob URL
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return null
    const blob = await res.blob()
    // Return a data URI so it's embedded in saved content and survives reloads
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return dataUrl
  } catch {
    return null
  }
}

export async function insertImageFromS3({ editor, imageUrl }: InsertImageParams) {
  if (!editor) return
  if (!imageUrl || typeof imageUrl !== 'string') return
  const src = await resolveImageUrlToUsableSrc(imageUrl)
  if (!src) return
  editor.chain().focus().setImage({ src }).run()
}

export interface InsertImageFromBackendParams {
  editor: any
  fileId: string
  fileName: string
}

// Lazy import to avoid circulars in environments without services eager-loading
async function downloadViaBackend(fileId: string, fileName: string) {
  const { ApiService } = await import('../../../backend/api/apiService')
  return ApiService.downloadS3File(fileId, fileName)
}

export async function insertImageFromBackendFile({ editor, fileId, fileName }: InsertImageFromBackendParams) {
  if (!editor) return
  if (!fileId) return
  try {
    const result = await downloadViaBackend(fileId, fileName)
    if (result?.success && result.url) {
      // Convert fetched blob to data URL so it's embedded
      const blob = result.blob as Blob
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      editor.chain().focus().setImage({ src: dataUrl }).run()
    }
  } catch {
    // silent fail
  }
}
