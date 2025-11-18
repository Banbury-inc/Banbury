import { ApiService } from '../../../../../backend/api/apiService'
import { FileSystemItem } from '../../../../utils/fileTreeUtils'

interface SaveArgs {
  notebook: any
  file: FileSystemItem
  username: string
}

export async function saveNotebookFile({ notebook, file, username }: SaveArgs) {
  const json = JSON.stringify(notebook, null, 2)
  const blob = new Blob([json], { type: 'application/json' })

  // Delete existing file in S3 (id changes on re-upload)
  if (file.file_id) {
    try { await ApiService.deleteS3File(file.file_id) } catch {}
  }

  const parentPath = file.path ? file.path.split('/').slice(0, -1).join('/') : ''
  await ApiService.uploadToS3(blob, file.name, 'web-editor', file.path || `${parentPath}/${file.name}`, parentPath)
}


