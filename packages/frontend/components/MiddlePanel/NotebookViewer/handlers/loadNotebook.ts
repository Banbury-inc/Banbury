import { ApiService } from '../../../../../backend/api/apiService'
import { FileSystemItem } from '../../../../utils/fileTreeUtils'

interface NotebookDocument {
  nbformat: number
  nbformat_minor: number
  metadata?: Record<string, any>
  cells: Array<any>
}

export async function loadNotebookFile(file: FileSystemItem): Promise<NotebookDocument> {
  if (!file.file_id) throw new Error('Missing file id')
  const { blob } = await ApiService.downloadS3File(file.file_id, file.name)
  const text = await blob.text()
  try {
    const parsed = JSON.parse(text)
    // minimal validation
    if (!parsed || !Array.isArray(parsed.cells)) throw new Error('Invalid notebook')
    return parsed as NotebookDocument
  } catch (e) {
    throw new Error('Invalid .ipynb content')
  }
}


