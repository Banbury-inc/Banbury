import { ApiService } from "../../../../../../backend/api/apiService"

interface SaveAsPDFParams {
  s3FileId: string
  fileName: string
  onSuccess?: (driveFileId: string, driveFileName: string) => void
  onError?: (error: string) => void
  showToast?: (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
  triggerSidebarRefresh: () => void
}

export async function handleSaveAsPDF({
  s3FileId,
  fileName,
  onSuccess,
  onError,
  showToast,
  triggerSidebarRefresh,
}: SaveAsPDFParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Saving as PDF...',
      description: `Saving "${fileName}" as PDF`,
    })

      const result = await ApiService.Files.saveAsPDF(s3FileId)

      if (result.success) {
        showToast?.({
          title: 'File saved as PDF successfully',
          description: `"${result.drive_file_name || fileName}" has been copied to Google Drive`,
          variant: 'success'
        })
        onSuccess?.(result.drive_file_id || '', result.drive_file_name || fileName)
        triggerSidebarRefresh()
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
