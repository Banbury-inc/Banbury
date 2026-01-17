import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { CONFIG } from '@/lib/config'
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

export interface UploadedFile {
  fileName: string
  fileUrl: string
  fileInfo: any
}

/**
 * Upload a file to S3
 */
export async function uploadFileToS3(filePath: string, token: string, folder: string = 'presentations'): Promise<UploadedFile | null> {
  const apiBase = CONFIG.url
  const fileName = path.basename(filePath)
  
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const blob = new Blob([fileBuffer])
    
    const formData = new FormData()
    formData.append('file', blob, fileName)
    formData.append('device_name', 'ai-assistant')
    formData.append('file_path', `${folder}/${fileName}`)
    formData.append('file_parent', folder)

    const resp = await fetch(`${apiBase}/files/upload_to_s3/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!resp.ok) {
      console.error(`Failed to upload ${fileName}: HTTP ${resp.status}`)
      return null
    }

    const data = await resp.json()
    return {
      fileName,
      fileUrl: data?.file_url,
      fileInfo: data?.file_info
    }
  } catch (err) {
    console.error(`Error uploading ${fileName}:`, err)
    return null
  }
}

/**
 * Convert percentage (0-100) to inches for 16:9 layout (10" x 5.625")
 */
export function percentToInches(percent: number, dimension: 'width' | 'height'): number {
  const slideWidth = 10
  const slideHeight = 5.625
  
  if (dimension === 'width') {
    return (percent / 100) * slideWidth
  } else {
    return (percent / 100) * slideHeight
  }
}

/**
 * Convert hex color to pptxgenjs format (without #)
 */
export function formatColor(color: string): string {
  return color.replace('#', '').toUpperCase()
}

/**
 * Get authentication token from context
 */
export function getAuthToken(context: any): string {
  let authToken = getServerContextValue<string>("authToken")
  if (!authToken) {
    authToken = context?.configurable?.authToken
  }
  if (!authToken) {
    throw new Error('Authentication token not found')
  }
  return authToken
}

/**
 * Load presentation from file path or create new one
 */
export async function loadOrCreatePresentation(presentationPath: string | undefined, presentationName: string): Promise<{ pptx: any; filePath: string; isNew: boolean }> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  pptx.author = 'Banbury AI'
  pptx.title = presentationName

  if (presentationPath && fs.existsSync(presentationPath)) {
    // Load existing presentation
    // Note: pptxgenjs doesn't support loading existing files directly
    // For now, we'll create a new one and note this limitation
    // Template-based operations should use the template tools instead
    return { pptx, filePath: presentationPath, isNew: false }
  }

  return { pptx, filePath: '', isNew: true }
}

/**
 * Save presentation to temporary file
 */
export async function savePresentation(pptx: any, tmpDir: string, presentationName: string): Promise<string> {
  const timestamp = Date.now()
  const fileName = `${presentationName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.pptx`
  const outputPath = path.join(tmpDir, fileName)
  
  await pptx.writeFile({ fileName: outputPath })
  return outputPath
}

/**
 * Download a file from S3 by fileId
 */
export async function downloadFileFromS3(fileId: string, token: string, outputPath?: string): Promise<string> {
  const apiBase = CONFIG.url
  const tmpDir = os.tmpdir()
  const finalOutputPath = outputPath || path.join(tmpDir, `downloaded_${fileId}_${Date.now()}.pptx`)
  
  try {
    // Get presigned URL or direct file download
    const response = await fetch(`${apiBase}/files/download_s3_file/${encodeURIComponent(fileId)}/`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error(`Failed to download file: HTTP ${response.status}`)
    }

    // Check content type to determine if this is JSON or direct file download
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // Response contains JSON with download URL
      const data = await response.json()
      const downloadUrl = data?.url || data?.download_url || data?.presigned_url

      if (!downloadUrl) {
        throw new Error('No download URL found in JSON response')
      }

      // Download the file from the presigned URL
      const fileResponse = await fetch(downloadUrl)
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file from presigned URL: HTTP ${fileResponse.status}`)
      }

      const arrayBuffer = await fileResponse.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      fs.writeFileSync(finalOutputPath, buffer)
    } else {
      // Response is the file itself - direct download
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      fs.writeFileSync(finalOutputPath, buffer)
    }

    return finalOutputPath
  } catch (err) {
    console.error(`Error downloading file ${fileId}:`, err)
    throw err
  }
}

/**
 * Update an existing S3 file (matches frontend ApiService.Files.updateS3File pattern)
 */
export async function updateS3File(
  fileId: string,
  filePath: string,
  token: string,
  fileName?: string
): Promise<UploadedFile | null> {
  const apiBase = CONFIG.url
  const finalFileName = fileName || path.basename(filePath)
  
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const blob = new Blob([fileBuffer])
    
    const formData = new FormData()
    formData.append('file', blob, finalFileName)

    const resp = await fetch(`${apiBase}/files/update_s3_file/${encodeURIComponent(fileId)}/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!resp.ok) {
      console.error(`Failed to update file ${fileId}: HTTP ${resp.status}`)
      return null
    }

    const data = await resp.json()
    if (data.result === 'success') {
      return {
        fileName: data.file_name || finalFileName,
        fileUrl: data.file_url || data.s3_key,
        fileInfo: {
          file_id: data.file_id || fileId,
          file_name: data.file_name || finalFileName,
          file_size: data.file_size,
          s3_key: data.s3_key
        }
      }
    } else {
      console.error(`Failed to update file ${fileId}: ${data.error || 'Unknown error'}`)
      return null
    }
  } catch (err) {
    console.error(`Error updating file ${fileId}:`, err)
    return null
  }
}

/**
 * Upload file to S3 and optionally update an existing file (replace it)
 * @deprecated Use updateS3File for updates, uploadFileToS3 for new uploads
 */
export async function uploadFileToS3WithUpdate(
  filePath: string, 
  token: string, 
  folder: string = 'presentations',
  existingFileId?: string
): Promise<UploadedFile | null> {
  // If updating an existing file, use the update endpoint (matches frontend handler pattern)
  if (existingFileId) {
    return updateS3File(existingFileId, filePath, token)
  }
  
  // Otherwise, use the upload endpoint for new files
  return uploadFileToS3(filePath, token, folder)
}
