import type { FileSystemItem } from "../../../../../utils/fileTreeUtils"
import { isCodeFile } from "../../../../../pages/Workspaces/handlers/fileTypeUtils"

const CURRENT_CODE_FILE_STORAGE_KEY = "assistant-current-code-file"

interface CurrentCodeFilePayload {
  filePath: string
  fileName: string
}

export function syncCurrentCodeFileContext(selectedFile?: FileSystemItem | null): void {
  if (!selectedFile?.path || !selectedFile?.name) return
  if (!isCodeFile(selectedFile.name)) return

  try {
    let preservedContent: string | undefined
    const raw = localStorage.getItem(CURRENT_CODE_FILE_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { filePath?: string; content?: string }
      if (parsed?.filePath === selectedFile.path && typeof parsed.content === "string")
        preservedContent = parsed.content
    }

    const payload: CurrentCodeFilePayload & { content?: string } = {
      filePath: selectedFile.path,
      fileName: selectedFile.name,
      ...(preservedContent !== undefined ? { content: preservedContent } : {}),
    }
    localStorage.setItem(CURRENT_CODE_FILE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore localStorage errors
  }
}
