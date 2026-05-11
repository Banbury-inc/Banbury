import type { MutableRefObject } from 'react'
import type { Editor, TLPageId } from 'tldraw'

interface CreateSetTldrawPageHandlerArgs {
  editorRef: MutableRefObject<Editor | null>
  setCurrentPageId: (pageId: TLPageId) => void
}

interface CreateCreateTldrawPageHandlerArgs {
  editorRef: MutableRefObject<Editor | null>
  setCurrentPageId: (pageId: TLPageId) => void
  setPages: (pages: ReturnType<Editor['getPages']>) => void
}

export function createSetTldrawPageHandler({ editorRef, setCurrentPageId }: CreateSetTldrawPageHandlerArgs) {
  return function setTldrawPage(pageId: TLPageId) {
    if (!editorRef.current) return

    editorRef.current.setCurrentPage(pageId)
    setCurrentPageId(pageId)
  }
}

export function createCreateTldrawPageHandler({ editorRef, setCurrentPageId, setPages }: CreateCreateTldrawPageHandlerArgs) {
  return function createTldrawPage() {
    if (!editorRef.current) return

    editorRef.current.createPage({})
    setPages(editorRef.current.getPages())
    setCurrentPageId(editorRef.current.getCurrentPageId())
  }
}
