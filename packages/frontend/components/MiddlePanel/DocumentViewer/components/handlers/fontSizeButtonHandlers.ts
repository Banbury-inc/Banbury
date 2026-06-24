import { Editor } from '@tiptap/react'
import { changeSelectionFontSize } from '../../../../handlers/editorFontSize'

export const DEFAULT_FONT_SIZE = 14
export const MIN_FONT_SIZE = 8
export const MAX_FONT_SIZE = 200

const FONT_SIZE_STEPS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96]

export function parseFontSizeValue(fontSize: string): number | null {
  const pxMatch = fontSize.match(/^([\d.]+)px$/)
  if (pxMatch) return Math.round(parseFloat(pxMatch[1]))

  const parsed = parseFloat(fontSize)
  if (!Number.isNaN(parsed)) return Math.round(parsed)

  return null
}

export function getSelectionFontSize(editor: Editor): number {
  const fontSize = editor.getAttributes('textStyle').fontSize as string | undefined
  if (!fontSize) return DEFAULT_FONT_SIZE

  return parseFontSizeValue(fontSize) ?? DEFAULT_FONT_SIZE
}

export function clampFontSize(fontSize: number): number {
  return Math.min(Math.max(fontSize, MIN_FONT_SIZE), MAX_FONT_SIZE)
}

export function incrementFontSize(currentSize: number): number {
  const currentIndex = FONT_SIZE_STEPS.findIndex(size => size >= currentSize)
  if (currentIndex === -1) return FONT_SIZE_STEPS[FONT_SIZE_STEPS.length - 1]
  if (currentIndex === FONT_SIZE_STEPS.length - 1) return FONT_SIZE_STEPS[FONT_SIZE_STEPS.length - 1]
  return FONT_SIZE_STEPS[currentIndex + 1]
}

export function decrementFontSize(currentSize: number): number {
  const currentIndex = FONT_SIZE_STEPS.findIndex(size => size >= currentSize)
  if (currentIndex <= 0) return FONT_SIZE_STEPS[0]
  return FONT_SIZE_STEPS[currentIndex - 1]
}

export function handleFontSizeChange({ editor, value }: { editor: Editor; value: string }) {
  const parsed = parseInt(value, 10)
  if (Number.isNaN(parsed)) return
  changeSelectionFontSize({ editor, fontSize: clampFontSize(parsed) })
}

export function handleFontSizeIncrement({ editor, currentSize }: { editor: Editor; currentSize: number }) {
  changeSelectionFontSize({ editor, fontSize: incrementFontSize(currentSize) })
}

export function handleFontSizeDecrement({ editor, currentSize }: { editor: Editor; currentSize: number }) {
  changeSelectionFontSize({ editor, fontSize: decrementFontSize(currentSize) })
}
