import { ApiService } from "../../../../../../backend/api/apiService"

type ToastFn = (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void

interface LocalDownloadParams {
  fileId: string
  fileName: string
  showToast?: ToastFn
  onSuccess?: () => void
  onError?: (error: string) => void
}

export async function handleLocalFileDownload({
  fileId,
  fileName,
  showToast,
  onSuccess,
  onError
}: LocalDownloadParams): Promise<boolean> {
  try {
    showToast?.({
      title: 'Downloading...',
      description: `Preparing "${fileName}" for download`,
    })

    const result = await ApiService.Files.downloadS3File(fileId, fileName)

    // Trigger browser download using the blob from the result
    const a = document.createElement('a')
    a.href = result.url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(result.url)

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
