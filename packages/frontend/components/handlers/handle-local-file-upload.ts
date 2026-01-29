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
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const fileName = file.name
          const filePath = `local-uploads/${timestamp}-${fileName}`
          const fileId = `local-${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

          // Read file content as base64
          const arrayBuffer = await file.arrayBuffer()
          const bytes = new Uint8Array(arrayBuffer)
          
          // Convert to base64 in chunks to avoid stack overflow
          let binary = ''
          const chunkSize = 8192
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize)
            binary += String.fromCharCode.apply(null, Array.from(chunk) as any)
          }
          const base64Data = btoa(binary)

          // Store the file data payload so AI can read it
          if (onAttachmentPayload) {
            onAttachmentPayload(fileId, { 
              fileData: base64Data, 
              mimeType: file.type || 'application/octet-stream' 
            })
          }

          // Convert to FileSystemItem format
          const fileItem: FileSystemItem = {
            id: fileId,
            file_id: fileId,
            name: fileName,
            type: 'file',
            path: filePath,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            date_modified: new Date().toISOString(),
            date_uploaded: new Date().toISOString()
          }

          return fileItem
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
        onError?.('Failed to process file(s)')
      } else {
        onSuccess?.(successfulUploads.length)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to process file(s)')
    } finally {
      // Clean up the input element
      document.body.removeChild(input)
    }
  }

  // Add to DOM and trigger click
  document.body.appendChild(input)
  input.click()
}
