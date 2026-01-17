import PptxGenJS from 'pptxgenjs'
import { CONFIG } from '../../../../../../../frontend/config/config'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

// In-memory presentation store (simple state management)
export const presentationStore = new Map<string, { pptx: PptxGenJS; slides: any[] }>()

// Mapping from fileId to presentationId (for looking up active presentations)
export const fileIdToPresentationIdMap = new Map<string, string>()

/**
 * Refresh files list by calling get_s3_files and emitting refresh event
 * This triggers the frontend to refresh the file list in the left panel
 */
export async function refreshFilesList(token: string): Promise<void> {
  try {
    const sendEvent = getServerContextValue<Function>("sendEvent")
    if (!sendEvent) return

    // Call get_s3_files endpoint to get updated file list
    const filesResp = await fetch(`${CONFIG.url}/files/get_s3_files/`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (filesResp.ok) {
      // Emit assistant-file-created event to trigger frontend refresh
      // The frontend listens for this event and calls refetch() to refresh the file list
      // We call get_s3_files on the backend to ensure data is fresh before triggering refresh
      sendEvent({
        type: "assistant-file-created",
        result: {
          file_info: {}
        }
      })
    }
  } catch (error) {
    // Silently fail - don't interrupt file operations
    console.error('Failed to refresh files list:', error)
  }
}

/**
 * Get or create a presentation in memory
 * If fileId is provided and presentationId is not, tries to look up the presentationId from the fileId mapping
 */
export function getOrCreatePresentation(presentationId: string | undefined, presentationName: string, fileId?: string): { pptx: PptxGenJS; slides: any[]; id: string } {
  // If presentationId not provided but fileId is, try to look it up from the mapping
  if (!presentationId && fileId) {
    const mappedPresentationId = fileIdToPresentationIdMap.get(fileId)
    if (mappedPresentationId) {
      presentationId = mappedPresentationId
    }
  }
  
  const id = presentationId || `pres_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  if (presentationStore.has(id)) {
    const stored = presentationStore.get(id)!
    return { pptx: stored.pptx, slides: stored.slides, id }
  }
  
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  pptx.author = 'Banbury AI'
  pptx.title = presentationName
  const slides: any[] = []
  
  presentationStore.set(id, { pptx, slides })
  return { pptx, slides, id }
}

/**
 * Store mapping from fileId to presentationId
 * Called when a presentation is created/opened
 */
export function mapFileIdToPresentationId(fileId: string, presentationId: string): void {
  fileIdToPresentationIdMap.set(fileId, presentationId)
}

/**
 * Save presentation and upload to S3
 * If fileId is provided, updates the existing file instead of creating a new one
 * Uses fetch directly for better Node.js compatibility
 */
export async function saveAndUploadPresentation(
  pptx: PptxGenJS, 
  presentationName: string, 
  context: any,
  fileId: string,
  token: string
): Promise<{ fileUrl: string; fileInfo: any; filePath: string; fileId?: string }> {
  const tmpDir = os.tmpdir()
  const timestamp = Date.now()
  
  // Ensure filename has .pptx extension
  const fileName = presentationName.endsWith('.pptx') 
    ? presentationName 
    : `${presentationName}.pptx`
  const outputPath = path.join(tmpDir, fileName)
  
  await pptx.writeFile({ fileName: outputPath })
  
  // Read the file that was just written to create a Blob
  const fileBuffer = fs.readFileSync(outputPath)
  const fileBlob = new Blob([fileBuffer])
  
  // Clean up temp file
  try {
    fs.unlinkSync(outputPath)
  } catch {
    // Ignore cleanup errors
  }
  
  // Upload using fetch directly (works better in Node.js than ApiService)
  const formData = new FormData()
  formData.append('file', fileBlob, fileName)
  
  const uploadResp = await fetch(`${CONFIG.url}/files/update_s3_file/${encodeURIComponent(fileId)}/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!uploadResp.ok) {
    const errorText = await uploadResp.text().catch(() => uploadResp.statusText)
    throw new Error(`Failed to update file: HTTP ${uploadResp.status} (${errorText})`)
  }

  const uploadData = await uploadResp.json()
  
  if (uploadData.result !== 'success') {
    throw new Error(uploadData.error || 'Failed to update presentation to cloud storage')
  }
  
  // Map the API response to the expected structure
  const fileInfo = {
    file_id: uploadData.file_id || fileId,
    file_name: uploadData.file_name || fileName,
    file_size: uploadData.file_size,
    s3_key: uploadData.s3_key
  }
  
  // Construct file URL from s3_key or file_url
  const fileUrl = uploadData.file_url || `${CONFIG.url}/files/${uploadData.s3_key}`
  
  // Refresh files list in left panel
  await refreshFilesList(token)
  
  return {
    fileUrl,
    fileInfo,
    filePath: outputPath,
    fileId: uploadData.file_id || fileId
  }
}
