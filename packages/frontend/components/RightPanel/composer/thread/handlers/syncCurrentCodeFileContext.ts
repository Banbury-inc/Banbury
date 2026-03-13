import type { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { isCodeFile } from "../../../../../pages/Workspaces/handlers/fileTypeUtils"

const CURRENT_CODE_FILE_STORAGE_KEY = "assistant-current-code-file"

interface CurrentCodeFilePayload {
  filePath: string
  fileName: string
}

function setCurrentCodeFileContext(payload: CurrentCodeFilePayload): void {
  try {
    localStorage.setItem(CURRENT_CODE_FILE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore localStorage errors
  }
}

export function syncCurrentCodeFileContext(selectedFile?: FileSystemItem | null): void {
  if (!selectedFile?.path || !selectedFile?.name) return
  if (!isCodeFile(selectedFile.name)) return

  setCurrentCodeFileContext({
    filePath: selectedFile.path,
    fileName: selectedFile.name,
  })
}
