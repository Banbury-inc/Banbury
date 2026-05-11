import type { MutableRefObject } from 'react'
import type { Editor } from 'tldraw'

interface CreateSetTldrawToolHandlerArgs {
  editorRef: MutableRefObject<Editor | null>
  setCurrentToolId: (toolId: string) => void
}

export function createSetTldrawToolHandler({ editorRef, setCurrentToolId }: CreateSetTldrawToolHandlerArgs) {
  return function setTldrawTool(toolId: string) {
    if (!editorRef.current) return

    editorRef.current.setCurrentTool(toolId)
    setCurrentToolId(toolId)
  }
}
