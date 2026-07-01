import { ApiService } from '../../../../../../../../backend/api/apiService'
import { openFilePicker } from '../../../../../../../utils/open-file-picker'

interface HandleFileUploadParams {
  username: string | undefined
  onUploadStart: () => void
  onUploadEnd: () => void
  onSuccess: () => void
  onError: () => void
}

export async function handleFileUpload({
  username,
  onUploadStart,
  onUploadEnd,
  onSuccess,
  onError,
}: HandleFileUploadParams): Promise<void> {
  if (!username) return

  const files = await openFilePicker()
  if (files.length === 0) return

  onUploadStart()
  try {
    const file = files[0]
    await ApiService.Files.uploadToS3(file, file.name, 'web-editor', file.name, '')
    onSuccess()
  } catch {
    onError()
  } finally {
    onUploadEnd()
  }
}
