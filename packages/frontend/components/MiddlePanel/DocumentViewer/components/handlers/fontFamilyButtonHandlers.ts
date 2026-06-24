import { Editor } from '@tiptap/react'

export const FONT_FAMILY_OPTIONS = [
  { label: 'Arial', value: null },
  { label: 'Inter', value: 'Inter' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Sans-serif', value: 'sans-serif' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monospace', value: 'monospace' },
] as const

export function getSelectionFontFamily(editor: Editor): string | null {
  const fontFamily = editor.getAttributes('textStyle').fontFamily as string | undefined
  if (!fontFamily || fontFamily.trim().length === 0) return null
  return fontFamily
}

export function getFontFamilyLabel(fontFamily: string | null): string {
  if (!fontFamily) return 'Arial'
  return fontFamily.split(',')[0].replace(/['"]/g, '').trim()
}

export function isFontFamilyOptionActive(selectedFont: string | null, option: string | null): boolean {
  if (!selectedFont && !option) return true
  if (!selectedFont || !option) return false

  const normalizedSelected = selectedFont.split(',')[0].replace(/['"]/g, '').trim().toLowerCase()
  return normalizedSelected === option.toLowerCase()
}
