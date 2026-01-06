import { CONFIG } from '../../../../../frontend/config/config'
import type { FileMetadata } from '../types'

export interface UploadResult {
  ok: boolean
  file_info?: {
    file_id?: string
    file_name: string
    file_path: string
    file_size?: number
  }
  error?: string
}

/**
 * Upload a file blob to S3 via the Banbury API
 */
export async function uploadToS3(
  blob: Blob,
  fileName: string,
  folder: string,
  authToken: string,
  metadata?: FileMetadata
): Promise<UploadResult> {
  try {
    const apiBase = CONFIG.url
    const filePath = `${folder}/${fileName}`

    const form = new FormData()
    form.append('file', blob, fileName)
    form.append('device_name', 'web-editor')
    form.append('file_path', filePath)
    form.append('file_parent', folder)

    const uploadResp = await fetch(`${apiBase}/files/upload_to_s3/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      } as any,
      body: form as any,
    })

    if (!uploadResp.ok) {
      const text = await uploadResp.text().catch(() => '')
      return {
        ok: false,
        error: `Upload failed: ${text || uploadResp.statusText}`
      }
    }

    const uploaded: any = await uploadResp.json()

    return {
      ok: true,
      file_info: uploaded?.file_info || {
        file_name: fileName,
        file_path: filePath,
        file_size: metadata?.size
      }
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    }
  }
}
