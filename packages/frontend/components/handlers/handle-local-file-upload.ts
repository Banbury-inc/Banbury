import { FileSystemItem } from '../../utils/fileTreeUtils'
import { openFilePicker } from '../../utils/open-file-picker'

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

  const files = await openFilePicker({ multiple: true })
  if (files.length === 0) {
    return
  }

  try {
    const uploadPromises = files.map(async (file) => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileName = file.name
        const filePath = `local-uploads/${timestamp}-${fileName}`
        const fileId = `local-${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)

        let binary = ''
        const chunkSize = 8192
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.slice(i, i + chunkSize)
          binary += String.fromCharCode.apply(null, Array.from(chunk) as number[])
        }
        const base64Data = btoa(binary)

        if (onAttachmentPayload) {
          onAttachmentPayload(fileId, {
            fileData: base64Data,
            mimeType: file.type || 'application/octet-stream'
          })
        }

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

    successfulUploads.forEach(file => onFileAttach(file))

    if (successfulUploads.length === 0) {
      onError?.('Failed to process file(s)')
    } else {
      onSuccess?.(successfulUploads.length)
    }
  } catch (error) {
    console.error('Error uploading files:', error)
    onError?.(error instanceof Error ? error.message : 'Failed to process file(s)')
  }
}
