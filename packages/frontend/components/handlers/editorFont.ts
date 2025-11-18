import { Editor } from '@tiptap/react'

export interface ChangeFontParams {
  editor: Editor | null
  fontFamily: string | null
}

export function changeSelectionFontFamily({ editor, fontFamily }: ChangeFontParams) {
  if (!editor) return
  if (fontFamily && fontFamily.trim().length > 0) {
    editor.chain().focus().setFontFamily(fontFamily).run()
    return
  }
  editor.chain().focus().unsetFontFamily().run()
}

 