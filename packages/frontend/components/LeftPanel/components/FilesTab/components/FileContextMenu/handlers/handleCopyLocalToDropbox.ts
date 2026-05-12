import { ApiService } from "../../../../../../../../backend/api/apiService"

interface CopyLocalToDropboxParams {
  s3FileId: string
  fileName: string
  onSuccess?: (_dropboxItemId: string, _dropboxFileName: string) => void
  onError?: (_error: string) => void
  showToast?: (_options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
}

export async function handleCopyLocalToDropbox({
  s3FileId,
  fileName,
  onSuccess,
  onError,
  showToast
}: CopyLocalToDropboxParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Copying file...',
      description: `Copying "${fileName}" to Dropbox`,
    })

    const result = await ApiService.Files.copyLocalFileToDropbox(s3FileId)
    if (!result.success) throw new Error('Copy operation failed')

    showToast?.({
      title: 'File copied successfully',
      description: `"${result.dropbox_file_name || fileName}" has been copied to Dropbox`,
      variant: 'success'
    })
    onSuccess?.(result.dropbox_item_id || '', result.dropbox_file_name || fileName)
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
