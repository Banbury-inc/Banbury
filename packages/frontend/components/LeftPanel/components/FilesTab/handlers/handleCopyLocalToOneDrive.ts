import { ApiService } from "../../../../../../backend/api/apiService"

interface CopyLocalToOneDriveParams {
  s3FileId: string
  fileName: string
  onSuccess?: (onedriveItemId: string, onedriveFileName: string) => void
  onError?: (error: string) => void
  showToast?: (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}

export async function handleCopyLocalToOneDrive({
  s3FileId,
  fileName,
  onSuccess,
  onError,
  showToast
}: CopyLocalToOneDriveParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Copying file...',
      description: `Copying "${fileName}" to OneDrive`,
    })

    const result = await ApiService.Files.copyLocalFileToOneDrive(s3FileId)

    if (result.success) {
      showToast?.({
        title: 'File copied successfully',
        description: `"${result.onedrive_file_name || fileName}" has been copied to OneDrive`,
        variant: 'success'
      })
      onSuccess?.(result.onedrive_item_id || '', result.onedrive_file_name || fileName)
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
