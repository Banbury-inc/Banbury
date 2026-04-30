const IDE_SETTINGS_KEY = 'ideSettings'

export interface IDESettings {
  theme: string
  fontSize: number
  wordWrap: 'on' | 'off'
  showLineNumbers: boolean
  showMinimap: boolean
}

const DEFAULTS: IDESettings = {
  theme: 'vs-dark',
  fontSize: 14,
  wordWrap: 'on',
  showLineNumbers: true,
  showMinimap: true,
}

export function getIDESettings(): IDESettings {
  if (typeof window === 'undefined') return DEFAULTS

  try {
    const stored = localStorage.getItem(IDE_SETTINGS_KEY)
    if (!stored) return DEFAULTS

    const parsed = JSON.parse(stored) as Partial<IDESettings>
    return {
      theme: typeof parsed.theme === 'string' ? parsed.theme : DEFAULTS.theme,
      fontSize: typeof parsed.fontSize === 'number' && parsed.fontSize >= 10 && parsed.fontSize <= 24
        ? parsed.fontSize
        : DEFAULTS.fontSize,
      wordWrap: parsed.wordWrap === 'on' || parsed.wordWrap === 'off' ? parsed.wordWrap : DEFAULTS.wordWrap,
      showLineNumbers: typeof parsed.showLineNumbers === 'boolean' ? parsed.showLineNumbers : DEFAULTS.showLineNumbers,
      showMinimap: typeof parsed.showMinimap === 'boolean' ? parsed.showMinimap : DEFAULTS.showMinimap,
    }
  } catch {
    return DEFAULTS
  }
}

export function setIDESettings(settings: Partial<IDESettings>): void {
  if (typeof window === 'undefined') return

  try {
    const current = getIDESettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(IDE_SETTINGS_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('ide-settings-updated'))
  } catch (error) {
    console.error('Error saving IDE settings:', error)
  }
}
