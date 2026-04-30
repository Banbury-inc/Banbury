const CURRENT_CODE_FILE_STORAGE_KEY = "assistant-current-code-file"

interface CurrentCodeFileContextPayload {
  filePath: string
  fileName: string
  content?: string
}

export function setCurrentCodeFileContext(payload: CurrentCodeFileContextPayload): void {
  try {
    const normalizedPayload = {
      filePath: payload.filePath,
      fileName: payload.fileName,
      // Keep a bounded preview to avoid oversized localStorage payloads.
      content: typeof payload.content === "string" ? payload.content.slice(0, 20000) : undefined,
    }
    localStorage.setItem(CURRENT_CODE_FILE_STORAGE_KEY, JSON.stringify(normalizedPayload))
  } catch {
    // Ignore localStorage errors
  }
}

export function clearCurrentCodeFileContext(filePath?: string): void {
  try {
    const raw = localStorage.getItem(CURRENT_CODE_FILE_STORAGE_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw) as { filePath?: string }
    if (filePath && parsed?.filePath !== filePath) return

    localStorage.removeItem(CURRENT_CODE_FILE_STORAGE_KEY)
  } catch {
    // Ignore localStorage errors
  }
}
