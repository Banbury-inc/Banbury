import { Editor } from '@tiptap/react'

export interface ChangeFontSizeParams {
  editor: Editor | null
  fontSize: number | null
}

export function changeSelectionFontSize({ editor, fontSize }: ChangeFontSizeParams) {
  if (!editor) return
  if (fontSize && fontSize > 0) {
    editor.chain().focus().setFontSize(`${fontSize}px`).run()
    return
  }
  editor.chain().focus().unsetFontSize().run()
}
