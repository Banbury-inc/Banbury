const COLORED_FILE_ICONS_KEY = 'coloredFileIcons'

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
