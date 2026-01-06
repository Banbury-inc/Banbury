import { ApiService } from "../../../../../../backend/api/apiService"

interface CopyDriveToLocalParams {
  driveFileId: string
  fileName: string
  onSuccess?: (localFileId: string, localPath: string) => void
  onError?: (error: string) => void
  showToast?: (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}

export async function handleCopyDriveToLocal({
  driveFileId,
  fileName,
  onSuccess,
  onError,
  showToast
}: CopyDriveToLocalParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Copying file...',
      description: `Copying "${fileName}" to Local storage`,
    })

    const result = await ApiService.Files.copyDriveFileToLocal(driveFileId)

    if (result.success) {
      showToast?.({
        title: 'File copied successfully',
        description: `"${result.file_name || fileName}" has been copied to Local storage`,
        variant: 'success'
      })
      onSuccess?.(result.local_file_id || '', result.local_path || '')
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
