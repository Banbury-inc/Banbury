import type { MutableRefObject } from 'react'
import type { Editor } from 'tldraw'
import { getSnapshot } from 'tldraw'
import { ApiService } from '../../../../../backend/api/apiService'

interface CreateSaveTldrawHandlerArgs {
  editorRef: MutableRefObject<Editor | null>
  fileId?: string
  fileName: string
  onSaved?: (content: string) => void
  clearUnsaved?: () => void
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function createSaveTldrawHandler({ editorRef, fileId, fileName, onSaved, clearUnsaved }: CreateSaveTldrawHandlerArgs) {
  return async function saveTldraw(): Promise<{ ok: boolean; fileId?: string; fileName?: string }> {
    if (!editorRef.current) {
      console.warn('[save-tldraw] No editor instance available')
      return { ok: false }
    }
    if (!fileId) {
      console.warn('[save-tldraw] No fileId provided; cannot save to S3')
      return { ok: false }
    }

    try {
      const { document, session } = getSnapshot(editorRef.current.store)
      const content = JSON.stringify({ document, session }, null, 2)
      const blob = new Blob([content], { type: 'application/json' })


      const res = await ApiService.Files.updateS3File(fileId, blob, fileName)

      if (onSaved) onSaved(content)
      if (clearUnsaved) clearUnsaved()
      return { ok: true, fileId: (res as any)?.file_id, fileName: (res as any)?.file_name }
    } catch (error) {
      console.error('[save-tldraw] Failed to save drawing to S3:', error)
      return { ok: false }
    }
  }
}


