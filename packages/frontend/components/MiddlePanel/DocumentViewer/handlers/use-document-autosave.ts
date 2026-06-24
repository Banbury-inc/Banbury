import { useCallback, useEffect, useRef, useState } from 'react'

export type DocumentAutosaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface SaveDocumentOptions {
  isAutosave: boolean
}

interface UseDocumentAutosaveParams {
  content: string
  canSave: boolean
  fileKey: string
  delayMs?: number
  saveDocument: (content: string, options: SaveDocumentOptions) => Promise<void>
}

interface UseDocumentAutosaveResult {
  status: DocumentAutosaveStatus
  lastSavedAt: Date | null
  saveNow: () => Promise<void>
}

export function useDocumentAutosave({
  content,
  canSave,
  fileKey,
  delayMs = 2000,
  saveDocument,
}: UseDocumentAutosaveParams): UseDocumentAutosaveResult {
  const [status, setStatus] = useState<DocumentAutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const savedContentRef = useRef<string | null>(null)
  const saveDocumentRef = useRef(saveDocument)
  const timerRef = useRef<number | null>(null)
  const isSavingRef = useRef(false)
  const queuedContentRef = useRef<string | null>(null)

  saveDocumentRef.current = saveDocument

  const clearPendingSave = useCallback(() => {
    if (!timerRef.current) return
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const runSave = useCallback(async (contentToSave: string, isAutosave: boolean) => {
    clearPendingSave()

    if (!canSave || !contentToSave) return

    if (isSavingRef.current) {
      queuedContentRef.current = contentToSave
      setStatus('dirty')
      return
    }

    isSavingRef.current = true
    setStatus('saving')

    try {
      await saveDocumentRef.current(contentToSave, { isAutosave })
      savedContentRef.current = contentToSave
      setLastSavedAt(new Date())
      setStatus('saved')
    } catch {
      setStatus('error')
    } finally {
      isSavingRef.current = false
      const queuedContent = queuedContentRef.current
      queuedContentRef.current = null

      if (queuedContent && queuedContent !== savedContentRef.current) {
        timerRef.current = window.setTimeout(() => {
          void runSave(queuedContent, true)
        }, delayMs)
      }
    }
  }, [canSave, clearPendingSave, delayMs])

  useEffect(() => {
    clearPendingSave()
    savedContentRef.current = null
    queuedContentRef.current = null
    isSavingRef.current = false
    setLastSavedAt(null)
    setStatus('idle')
  }, [clearPendingSave, fileKey])

  useEffect(() => {
    if (!canSave || !content) return

    if (savedContentRef.current === null) {
      savedContentRef.current = content
      return
    }

    if (content === savedContentRef.current) return

    setStatus('dirty')
    clearPendingSave()
    timerRef.current = window.setTimeout(() => {
      void runSave(content, true)
    }, delayMs)

    return clearPendingSave
  }, [canSave, clearPendingSave, content, delayMs, runSave])

  useEffect(() => clearPendingSave, [clearPendingSave])

  const saveNow = useCallback(async () => {
    await runSave(content, false)
  }, [content, runSave])

  return {
    status,
    lastSavedAt,
    saveNow,
  }
}
