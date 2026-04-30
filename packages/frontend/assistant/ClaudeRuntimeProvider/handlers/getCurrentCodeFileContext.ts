interface CurrentCodeFileContext {
  filePath: string
  fileName?: string
  content?: string
}

const CURRENT_CODE_FILE_STORAGE_KEY = "assistant-current-code-file"

export function getCurrentCodeFileContext(): CurrentCodeFileContext | undefined {
  try {
    const raw = localStorage.getItem(CURRENT_CODE_FILE_STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Partial<CurrentCodeFileContext>
    if (!parsed?.filePath || typeof parsed.filePath !== "string") return undefined

    return {
      filePath: parsed.filePath,
      fileName: typeof parsed.fileName === "string" ? parsed.fileName : undefined,
      content: typeof parsed.content === "string" ? parsed.content : undefined,
    }
  } catch {
    return undefined
  }
}
