/**
 * IDE theme configuration for Monaco Editor.
 * Includes built-in themes and custom theme definitions.
 */

export interface IDEThemeOption {
  id: string
  label: string
  monacoThemeId: string
  isBuiltIn: boolean
}

/** Built-in Monaco themes + custom themes we register via defineTheme */
export const IDE_THEME_OPTIONS: IDEThemeOption[] = [
  { id: 'vs-dark', label: 'VS Dark', monacoThemeId: 'vs-dark', isBuiltIn: true },
  { id: 'vs-light', label: 'VS Light', monacoThemeId: 'vs', isBuiltIn: true },
  { id: 'hc-black', label: 'High Contrast Dark', monacoThemeId: 'hc-black', isBuiltIn: true },
  { id: 'hc-light', label: 'High Contrast Light', monacoThemeId: 'hc-light', isBuiltIn: true },
  { id: 'dracula', label: 'Dracula', monacoThemeId: 'dracula', isBuiltIn: false },
  { id: 'github-dark', label: 'GitHub Dark', monacoThemeId: 'github-dark', isBuiltIn: false },
  { id: 'github-light', label: 'GitHub Light', monacoThemeId: 'github-light', isBuiltIn: false },
  { id: 'one-dark', label: 'One Dark', monacoThemeId: 'one-dark', isBuiltIn: false },
  { id: 'solarized-dark', label: 'Solarized Dark', monacoThemeId: 'solarized-dark', isBuiltIn: false },
  { id: 'solarized-light', label: 'Solarized Light', monacoThemeId: 'solarized-light', isBuiltIn: false },
]

export const DEFAULT_THEME_ID = 'vs-dark'

export type IDEThemeId = (typeof IDE_THEME_OPTIONS)[number]['id']

export function getMonacoThemeId(themeId: string): string {
  const option = IDE_THEME_OPTIONS.find((t) => t.id === themeId)
  return option?.monacoThemeId ?? DEFAULT_THEME_ID
}

/** Minimal type for Monaco instance when registering themes (avoids strict editor.api compatibility). */
export type MonacoThemeRegistry = { editor: { defineTheme: (name: string, data: unknown) => void } }

/** Registers custom themes with Monaco. Call from Editor beforeMount. */
export function registerMonacoThemes(monaco: MonacoThemeRegistry) {
  // Dracula - https://draculatheme.com
  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#44475a',
      'editor.selectionBackground': '#44475a',
      'editorCursor.foreground': '#f8f8f2',
    },
  })

  // GitHub Dark
  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editorCursor.foreground': '#58a6ff',
    },
  })

  // GitHub Light
  monaco.editor.defineTheme('github-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24292f',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editor.selectionBackground': '#b6e3ff',
      'editorCursor.foreground': '#0969da',
    },
  })

  // One Dark (Atom)
  monaco.editor.defineTheme('one-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#282c34',
      'editor.foreground': '#abb2bf',
      'editor.lineHighlightBackground': '#2c313c',
      'editor.selectionBackground': '#3e4451',
      'editorCursor.foreground': '#528bff',
    },
  })

  // Solarized Dark
  monaco.editor.defineTheme('solarized-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#002b36',
      'editor.foreground': '#839496',
      'editor.lineHighlightBackground': '#073642',
      'editor.selectionBackground': '#073642',
      'editorCursor.foreground': '#839496',
    },
  })

  // Solarized Light
  monaco.editor.defineTheme('solarized-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#fdf6e3',
      'editor.foreground': '#657b83',
      'editor.lineHighlightBackground': '#eee8d5',
      'editor.selectionBackground': '#eee8d5',
      'editorCursor.foreground': '#657b83',
    },
  })
}
