import type { MutableRefObject } from 'react'
import type { Editor } from 'tldraw'

interface CreateTldrawHistoryHandlersArgs {
  editorRef: MutableRefObject<Editor | null>
}

export function createTldrawHistoryHandlers({ editorRef }: CreateTldrawHistoryHandlersArgs) {
  return {
    undo() {
      if (!editorRef.current) return
      editorRef.current.undo()
    },
    redo() {
      if (!editorRef.current) return
      editorRef.current.redo()
    },
  }
}
