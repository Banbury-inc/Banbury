import { ApiService } from '../../../backend/api/apiService'
import { FileSystemItem } from '../../utils/fileTreeUtils'

interface HandleClipboardPasteParams {
  event: ClipboardEvent
  userInfo: { username: string; email?: string } | null
  onFileAttach: (file: FileSystemItem) => void
  onAttachmentPayload?: (fileId: string, payload: { fileData: string; mimeType: string }) => void
  onError?: (error: string) => void
  onSuccess?: (count: number) => void
}

export async function handleClipboardPaste({
  event,
  userInfo,
  onFileAttach,
  onAttachmentPayload,
  onError,
  onSuccess
}: HandleClipboardPasteParams): Promise<boolean> {
  if (!event.clipboardData) return false

  const items = Array.from(event.clipboardData.items)
  const imageItems = items.filter(item => item.type.startsWith('image/'))

  if (imageItems.length === 0) return false

  // Prevent default paste behavior for images
  event.preventDefault()

  if (!userInfo?.username) {
    onError?.('Please log in to upload images')
    return true
  }

  try {
    // Process all images in parallel
    const uploadPromises = imageItems.map(async (item) => {
      try {
        const file = item.getAsFile()
        if (!file) {
          console.error('Failed to get file from clipboard item')
          return null
        }

        // Convert to base64 for AI vision
        const arrayBuffer = await file.arrayBuffer()
        const base64Data = btoa(String.fromCharCode(...Array.from(new Uint8Array(arrayBuffer))))
        const mimeType = file.type

        // Generate a unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const extension = file.type.split('/')[1] || 'png'
        const fileName = `pasted-image-${timestamp}.${extension}`
        const filePath = `pasted-images/${fileName}`
        const fileParent = 'pasted-images'

        // Upload to S3
        const result = await ApiService.uploadToS3(
          file,
          fileName,
          'web-upload',
          filePath,
          fileParent
        )

        if (result.success && result.file_info) {
          const fileId = result.file_info.file_id || `temp-${Date.now()}`
          
          // Store base64 payload so AI can see the image immediately
          if (onAttachmentPayload && fileId) {
            onAttachmentPayload(fileId, { fileData: base64Data, mimeType })
          }

          // Convert to FileSystemItem format
          const fileItem: FileSystemItem = {
            id: fileId,
            file_id: fileId,
            name: fileName,
            type: 'file',
            path: filePath,
            file_type: file.type,
            file_size: file.size,
            date_modified: new Date().toISOString(),
            date_uploaded: new Date().toISOString()
          }

          return fileItem
        }

        console.error('Upload failed or missing file_info:', result)
        return null
      } catch (itemError) {
        console.error('Error processing individual image:', itemError)
        return null
      }
    })

    const uploadedFiles = await Promise.all(uploadPromises)
    const successfulUploads = uploadedFiles.filter((file): file is FileSystemItem => file !== null)

    // Attach all successfully uploaded files
    successfulUploads.forEach(file => onFileAttach(file))

    if (successfulUploads.length === 0) {
      onError?.('Failed to upload pasted image(s)')
    } else {
      onSuccess?.(successfulUploads.length)
    }

    return true
  } catch (error) {
    console.error('Error uploading pasted image:', error)
    onError?.(error instanceof Error ? error.message : 'Failed to upload pasted image')
    return true
  }
}

