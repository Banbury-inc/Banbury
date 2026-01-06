import { ApiService } from "../../../../../../backend/api/apiService"

interface CopyLocalToDriveParams {
  s3FileId: string
  fileName: string
  onSuccess?: (driveFileId: string, driveFileName: string) => void
  onError?: (error: string) => void
  showToast?: (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}

export async function handleCopyLocalToDrive({
  s3FileId,
  fileName,
  onSuccess,
  onError,
  showToast
}: CopyLocalToDriveParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Copying file...',
      description: `Copying "${fileName}" to Google Drive`,
    })

    const result = await ApiService.Files.copyLocalFileToDrive(s3FileId)

    if (result.success) {
      showToast?.({
        title: 'File copied successfully',
        description: `"${result.drive_file_name || fileName}" has been copied to Google Drive`,
        variant: 'success'
      })
      onSuccess?.(result.drive_file_id || '', result.drive_file_name || fileName)
      return true
    } else {
      throw new Error('Copy operation failed')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to copy file'
    showToast?.({
      title: 'Failed to copy file',
      description: errorMessage,
      variant: 'destructive'
    })
    onError?.(errorMessage)
    return false
  }
}
