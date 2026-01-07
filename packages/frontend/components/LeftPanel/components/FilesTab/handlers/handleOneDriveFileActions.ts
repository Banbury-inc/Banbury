import OneDrive from "../../../../../../backend/api/onedrive/onedrive"

type ToastFn = (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void

interface OneDriveActionParams {
  itemId: string
  fileName: string
  showToast?: ToastFn
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface OneDriveRenameParams extends OneDriveActionParams {
  newName: string
}

export async function handleOneDriveRename({
  itemId,
  fileName,
  newName,
  showToast,
  onSuccess,
  onError
}: OneDriveRenameParams): Promise<boolean> {
  try {
    await OneDrive.renameOrMove(itemId, newName)
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

export async function handleOneDriveDelete({
  itemId,
  fileName,
  showToast,
  onSuccess,
  onError
}: OneDriveActionParams): Promise<boolean> {
  try {
    await OneDrive.deleteItem(itemId)
    showToast?.({
      title: 'File deleted',
      description: `"${fileName}" has been deleted`,
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

export async function handleOneDriveAddFavorite({
  itemId,
  fileName,
  showToast,
  onSuccess,
  onError
}: OneDriveActionParams): Promise<boolean> {
  try {
    await OneDrive.addFavorite(itemId)
    showToast?.({
      title: 'Added to favorites',
      description: `"${fileName}" has been added to favorites`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add to favorites'
    showToast?.({
      title: 'Failed to add to favorites',
      description: errorMessage,
      variant: 'destructive'
    })
    onError?.(errorMessage)
    return false
  }
}

export async function handleOneDriveRemoveFavorite({
  itemId,
  fileName,
  showToast,
  onSuccess,
  onError
}: OneDriveActionParams): Promise<boolean> {
  try {
    await OneDrive.removeFavorite(itemId)
    showToast?.({
      title: 'Removed from favorites',
      description: `"${fileName}" has been removed from favorites`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove from favorites'
    showToast?.({
      title: 'Failed to remove from favorites',
      description: errorMessage,
      variant: 'destructive'
    })
    onError?.(errorMessage)
    return false
  }
}

export async function handleOneDriveDownload({
  itemId,
  fileName,
  showToast,
  onSuccess,
  onError
}: OneDriveActionParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Downloading...',
      description: `Preparing "${fileName}" for download`,
    })

    const blob = await OneDrive.downloadFile(itemId)

    // Trigger browser download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast?.({
      title: 'Download started',
      description: `"${fileName}" is downloading`,
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
