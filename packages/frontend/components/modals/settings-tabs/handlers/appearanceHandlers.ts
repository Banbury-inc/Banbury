const COLORED_FILE_ICONS_KEY = 'coloredFileIcons'
const DOCUMENT_EDITOR_DARK_MODE_KEY = 'documentEditorDarkMode'

export const DOCUMENT_EDITOR_DARK_MODE_UPDATED_EVENT = 'document-editor-dark-mode-updated'

export function getColoredFileIcons(): boolean {
  if (typeof window === 'undefined') return true
  
  try {
    const stored = localStorage.getItem(COLORED_FILE_ICONS_KEY)
    // Default to true (colored icons) if not set
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}

export function setColoredFileIcons(enabled: boolean): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(COLORED_FILE_ICONS_KEY, enabled ? 'true' : 'false')
    // Dispatch storage event for other components to pick up
    window.dispatchEvent(new CustomEvent('colored-file-icons-updated'))
  } catch (error) {
    console.error('Error saving colored file icons setting:', error)
  }
}

export function getDocumentEditorDarkMode(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const stored = localStorage.getItem(DOCUMENT_EDITOR_DARK_MODE_KEY)
    return stored === 'true'
  } catch {
    return false
  }
}

export function setDocumentEditorDarkMode(enabled: boolean): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(DOCUMENT_EDITOR_DARK_MODE_KEY, enabled ? 'true' : 'false')
    window.dispatchEvent(new CustomEvent(DOCUMENT_EDITOR_DARK_MODE_UPDATED_EVENT))
  } catch (error) {
    console.error('Error saving document editor dark mode setting:', error)
  }
}

export function handleDocumentEditorDarkModeToggle(
  checked: boolean,
  setDocumentEditorDarkModeState: (checked: boolean) => void
): void {
  setDocumentEditorDarkMode(checked)
  setDocumentEditorDarkModeState(checked)
}

export function createDocumentEditorDarkModeUpdateHandler(
  setDocumentEditorDarkModeState: (checked: boolean) => void
) {
  return function handleDocumentEditorDarkModeUpdate() {
    setDocumentEditorDarkModeState(getDocumentEditorDarkMode())
  }
}
