import { ApiService } from "../../../../../../backend/api/apiService"

interface CopyLocalToDriveParams {
  s3FileId: string
  fileName: string
  onSuccess?: (driveFileId: string, driveFileName: string) => void
  onError?: (error: string) => void
  showToast?: (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void
  triggerSidebarRefresh?: () => void
}

export async function handleCopyLocalToDrive({
  s3FileId,
  fileName,
  onSuccess,
  onError,
  showToast,
  triggerSidebarRefresh
}: CopyLocalToDriveParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Copying file...',
      description: `Copying "${fileName}" to Google Drive`,
    })

    // Check if this is a PowerPoint file
    const isPowerPoint = fileName.toLowerCase().endsWith('.pptx') || fileName.toLowerCase().endsWith('.ppt')

    if (isPowerPoint) {
      // For PowerPoint files, download from S3 and upload to Drive with Google Slides MIME type
      const downloadResult = await ApiService.Files.downloadS3File(s3FileId, fileName)

      if (!downloadResult.success || !downloadResult.blob) {
        throw new Error('Failed to download file from S3')
      }

      // Create a File object (keep original PPTX content type)
      const fileToUpload = new File([downloadResult.blob], fileName, {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      })

      // Upload to Google Drive with target MIME type for conversion to Google Slides
      const driveFile = await ApiService.Drive.uploadFile(
        fileToUpload,
        fileName,
        undefined, // no parent folder
        'application/vnd.google-apps.presentation' // target MIME type for conversion
      )

      showToast?.({
        title: 'File copied successfully',
        description: `"${driveFile.name}" has been copied to Google Drive as a Google Slide`,
        variant: 'success'
      })
      onSuccess?.(driveFile.id, driveFile.name)
      return true
    } else {
      // For non-PowerPoint files, use the regular copy method
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
