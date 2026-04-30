import { ApiService } from '../../../../../backend/api/apiService'
import { FileSystemItem } from '../../../../utils/fileTreeUtils'

interface SaveCodeFileToS3Input {
  file: FileSystemItem
  content: string
  username?: string
}

export async function saveCodeFileToS3({
  file,
  content,
  username,
}: SaveCodeFileToS3Input) {
  const blob = new Blob([content], { type: 'text/plain' })

  if (file.file_id) {
    const result = await ApiService.Files.updateS3File(file.file_id, blob, file.name)
    if (!result.success) throw new Error('Failed to update file')
    return
  }

  await ApiService.Files.uploadToS3(
    blob,
    file.name,
    username || 'web-editor',
    file.path,
    ''
  )
}
