import Drive from "../../../../../../backend/api/drive/drive"

type ToastFn = (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void

interface DriveActionParams {
  fileId: string
  fileName: string
  showToast?: ToastFn
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface DriveRenameParams extends DriveActionParams {
  newName: string
}

export async function handleDriveRename({
  fileId,
  fileName,
  newName,
  showToast,
  onSuccess,
  onError
}: DriveRenameParams): Promise<boolean> {
  try {
    await Drive.renameFile(fileId, newName)
    showToast?.({
      title: 'File renamed',
      description: `"${fileName}" has been renamed to "${newName}"`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to rename file'
    showToast?.({
      title: 'Failed to rename file',
      description: errorMessage,
      variant: 'destructive'
    })
    onError?.(errorMessage)
    return false
  }
}

export async function handleDriveDelete({
  fileId,
  fileName,
  showToast,
  onSuccess,
  onError
}: DriveActionParams): Promise<boolean> {
  try {
    await Drive.deleteFile(fileId)
    showToast?.({
      title: 'File deleted',
      description: `"${fileName}" has been moved to trash`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete file'
    showToast?.({
      title: 'Failed to delete file',
      description: errorMessage,
      variant: 'destructive'
    })
    onError?.(errorMessage)
    return false
  }
}

export async function handleDriveStar({
  fileId,
  fileName,
  showToast,
  onSuccess,
  onError
}: DriveActionParams): Promise<boolean> {
  try {
    await Drive.starFile(fileId)
    showToast?.({
      title: 'File starred',
      description: `"${fileName}" has been starred`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to star file'
    showToast?.({
      title: 'Failed to star file',
      description: errorMessage,
      variant: 'destructive'
    })
    onError?.(errorMessage)
    return false
  }
}

export async function handleDriveUnstar({
  fileId,
  fileName,
  showToast,
  onSuccess,
  onError
}: DriveActionParams): Promise<boolean> {
  try {
    await Drive.unstarFile(fileId)
    showToast?.({
      title: 'File unstarred',
      description: `"${fileName}" has been unstarred`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to unstar file'
    showToast?.({
      title: 'Failed to unstar file',
      description: errorMessage,
      variant: 'destructive'
    })
    onError?.(errorMessage)
    return false
  }
}

// Mapping of Google Workspace MIME types to export formats
const GOOGLE_WORKSPACE_EXPORT_MAP: Record<string, { mimeType: string; extension: string }> = {
  'application/vnd.google-apps.document': { 
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx'
  },
  'application/vnd.google-apps.spreadsheet': { 
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx'
  },
  'application/vnd.google-apps.presentation': { 
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extension: '.pptx'
  },
  'application/vnd.google-apps.drawing': { 
    mimeType: 'image/png',
    extension: '.png'
  },
}

interface DriveDownloadParams extends DriveActionParams {
  mimeType?: string
}

export async function handleDriveDownload({
  fileId,
  fileName,
  mimeType,
  showToast,
  onSuccess,
  onError
}: DriveDownloadParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Downloading...',
      description: `Preparing "${fileName}" for download`,
    })

    let blob: Blob
    let downloadFileName = fileName
    
    // Check if this is a Google Workspace file that needs export
    const exportConfig = mimeType ? GOOGLE_WORKSPACE_EXPORT_MAP[mimeType] : undefined
    
    if (exportConfig) {
      blob = await Drive.exportFile(fileId, exportConfig.mimeType)
      // Add appropriate extension if not already present
      if (!downloadFileName.endsWith(exportConfig.extension)) {
        downloadFileName = downloadFileName + exportConfig.extension
      }
    } else {
      blob = await Drive.downloadFile(fileId)
    }

    // Trigger browser download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast?.({
      title: 'Download started',
      description: `"${downloadFileName}" is downloading`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to download file'
    showToast?.({
      title: 'Failed to download file',
      description: errorMessage,
      variant: 'destructive'
    })
    onError?.(errorMessage)
    return false
  }
}
