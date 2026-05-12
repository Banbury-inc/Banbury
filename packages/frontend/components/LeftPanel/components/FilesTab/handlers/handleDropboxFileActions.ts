import Dropbox from "../../../../../../backend/api/dropbox/dropbox"

type ToastFn = (_options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void

interface DropboxActionParams {
  itemId: string
  fileName: string
  showToast?: ToastFn
  onSuccess?: () => void
  onError?: (_error: string) => void
}

interface DropboxRenameParams extends DropboxActionParams {
  newName: string
}

export async function handleDropboxRename({
  itemId,
  fileName,
  newName,
  showToast,
  onSuccess,
  onError
}: DropboxRenameParams): Promise<boolean> {
  try {
    await Dropbox.renameOrMove(itemId, newName)
    showToast?.({
      title: 'File renamed',
      description: `"${fileName}" has been renamed to "${newName}"`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to rename file'
    showToast?.({ title: 'Failed to rename file', description: errorMessage, variant: 'destructive' })
    onError?.(errorMessage)
    return false
  }
}

export async function handleDropboxDelete({
  itemId,
  fileName,
  showToast,
  onSuccess,
  onError
}: DropboxActionParams): Promise<boolean> {
  try {
    await Dropbox.deleteItem(itemId)
    showToast?.({
      title: 'File deleted',
      description: `"${fileName}" has been deleted`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete file'
    showToast?.({ title: 'Failed to delete file', description: errorMessage, variant: 'destructive' })
    onError?.(errorMessage)
    return false
  }
}

export async function handleDropboxAddFavorite({
  itemId,
  fileName,
  showToast,
  onSuccess,
  onError
}: DropboxActionParams): Promise<boolean> {
  try {
    await Dropbox.addFavorite(itemId)
    showToast?.({
      title: 'Added to favorites',
      description: `"${fileName}" has been added to favorites`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add to favorites'
    showToast?.({ title: 'Failed to add to favorites', description: errorMessage, variant: 'destructive' })
    onError?.(errorMessage)
    return false
  }
}

export async function handleDropboxRemoveFavorite({
  itemId,
  fileName,
  showToast,
  onSuccess,
  onError
}: DropboxActionParams): Promise<boolean> {
  try {
    await Dropbox.removeFavorite(itemId)
    showToast?.({
      title: 'Removed from favorites',
      description: `"${fileName}" has been removed from favorites`,
      variant: 'success'
    })
    onSuccess?.()
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove from favorites'
    showToast?.({ title: 'Failed to remove from favorites', description: errorMessage, variant: 'destructive' })
    onError?.(errorMessage)
    return false
  }
}

export async function handleDropboxDownload({
  itemId,
  fileName,
  showToast,
  onSuccess,
  onError
}: DropboxActionParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Downloading...',
      description: `Preparing "${fileName}" for download`
    })

    const blob = await Dropbox.downloadFile(itemId)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
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
    showToast?.({ title: 'Failed to download file', description: errorMessage, variant: 'destructive' })
    onError?.(errorMessage)
    return false
  }
}

export async function handleDropboxShare({
  itemId,
  fileName,
  showToast,
  onError
}: DropboxActionParams): Promise<boolean> {
  try {
    const { link } = await Dropbox.createShareLink(itemId)
    await navigator.clipboard.writeText(link)
    showToast?.({
      title: 'Share link copied',
      description: `"${fileName}" link has been copied to your clipboard`,
      variant: 'success'
    })
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create share link'
    showToast?.({ title: 'Failed to share file', description: errorMessage, variant: 'destructive' })
    onError?.(errorMessage)
    return false
  }
}
