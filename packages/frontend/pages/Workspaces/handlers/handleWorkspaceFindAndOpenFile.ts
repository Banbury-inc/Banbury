import type { FileSystemItem } from '@/utils/fileTreeUtils'
import { ApiService } from 'backend/api/apiService'

interface HandleWorkspaceFindAndOpenFileParams {
  activePanelId: string
  openFileInTabCallback: (file: FileSystemItem, targetPanelId: string) => void
  setFileSearchOpen: (open: boolean) => void
}

interface S3SearchFile {
  file_id?: string
  _id?: string
  file_name: string
  file_path: string
  file_size?: number
  date_modified?: string
}

export function createWorkspaceFindAndOpenFileHandler({
  activePanelId,
  openFileInTabCallback,
  setFileSearchOpen
}: HandleWorkspaceFindAndOpenFileParams): (event: Event) => void {
  return async (event: Event) => {
    const detail = (event as CustomEvent).detail || {}
    const { fileName, filePath } = detail as { fileName?: string; filePath?: string }
    if (!fileName && !filePath) return

    try {
      const searchQuery = filePath || fileName
      const result = await ApiService.searchS3Files(searchQuery)

      if (result?.files && result.files.length > 0) {
        let matchedFile = result.files.find(
          (f: S3SearchFile) => f.file_path === filePath
        ) as S3SearchFile | undefined
        if (!matchedFile) {
          matchedFile = result.files.find(
            (f: S3SearchFile) => f.file_name === fileName
          ) as S3SearchFile | undefined
        }
        if (!matchedFile) {
          matchedFile = result.files[0] as S3SearchFile
        }

        const file: FileSystemItem = {
          id: matchedFile.file_id || matchedFile._id || '',
          file_id: matchedFile.file_id || matchedFile._id || '',
          name: matchedFile.file_name,
          path: matchedFile.file_path,
          type: 'file',
          size: matchedFile.file_size,
          modified: matchedFile.date_modified
            ? new Date(matchedFile.date_modified)
            : undefined
        }

        openFileInTabCallback(file, activePanelId)
      } else {
        setFileSearchOpen(true)
      }
    } catch (err) {
      console.error('[Workspaces] Error searching for file:', err)
      setFileSearchOpen(true)
    }
  }
}

export const WORKSPACE_FIND_AND_OPEN_FILE_EVENT = 'workspace-find-and-open-file'
