import { ApiService } from "../../../../../../../../backend/api/apiService"

interface CopyDropboxToLocalParams {
  dropboxItemId: string
  fileName: string
  onSuccess?: (_localFileId: string, _localPath: string) => void
  onError?: (_error: string) => void
  showToast?: (_options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}

export async function handleCopyDropboxToLocal({
  dropboxItemId,
  fileName,
  onSuccess,
  onError,
  showToast
}: CopyDropboxToLocalParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Copying file...',
      description: `Copying "${fileName}" to Local storage`,
    })

    const result = await ApiService.Files.copyDropboxFileToLocal(dropboxItemId)
    if (!result.success) throw new Error('Copy operation failed')

    showToast?.({
      title: 'File copied successfully',
      description: `"${result.file_name || fileName}" has been copied to Local storage`,
      variant: 'success'
    })
    onSuccess?.(result.local_file_id || '', result.local_path || '')
    return true
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
