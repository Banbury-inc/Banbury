import { ApiService } from '../../../backend/api/apiService'
import { FileSystemItem } from '../../utils/fileTreeUtils'

interface HandleLocalFileUploadParams {
  userInfo: { username: string; email?: string } | null
  onFileAttach: (file: FileSystemItem) => void
  onAttachmentPayload?: (fileId: string, payload: { fileData: string; mimeType: string }) => void
  onError?: (error: string) => void
  onSuccess?: (count: number) => void
}

export async function handleLocalFileUpload({
  userInfo,
  onFileAttach,
  onAttachmentPayload,
  onError,
  onSuccess
}: HandleLocalFileUploadParams): Promise<void> {
  if (!userInfo?.username) {
    onError?.('Please log in to upload files')
    return
  }

  // Create a hidden file input element
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.style.display = 'none'

  // Listen for file selection
  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = target.files

    if (!files || files.length === 0) {
      return
    }

    try {
      // Process all files in parallel
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Generate upload path
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const fileName = file.name
          const filePath = `local-uploads/${timestamp}-${fileName}`
          const fileParent = 'local-uploads'

          // For images, convert to base64 for AI vision
          let base64Data: string | undefined
          const isImage = file.type.startsWith('image/')

          if (isImage) {
            const arrayBuffer = await file.arrayBuffer()
            base64Data = btoa(String.fromCharCode(...Array.from(new Uint8Array(arrayBuffer))))
          }

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

            // Store base64 payload for images so AI can see them immediately
            if (onAttachmentPayload && fileId && isImage && base64Data) {
              onAttachmentPayload(fileId, { fileData: base64Data, mimeType: file.type })
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
          console.error('Error processing individual file:', itemError)
          return null
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      const successfulUploads = uploadedFiles.filter((file): file is FileSystemItem => file !== null)

      // Attach all successfully uploaded files
      successfulUploads.forEach(file => onFileAttach(file))

      if (successfulUploads.length === 0) {
        onError?.('Failed to upload file(s)')
      } else {
        onSuccess?.(successfulUploads.length)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to upload file(s)')
    } finally {
      // Clean up the input element
      document.body.removeChild(input)
    }
  }

  // Add to DOM and trigger click
  document.body.appendChild(input)
  input.click()
}
