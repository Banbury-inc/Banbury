import { useCallback, useEffect, useRef, useState } from 'react'

export type TldrawAutosaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface SaveTldrawOptions {
  isAutosave: boolean
}

interface UseTldrawAutosaveParams {
  changeVersion: number
  canSave: boolean
  fileKey: string
  delayMs?: number
  saveDrawing: (options: SaveTldrawOptions) => Promise<boolean>
}

interface UseTldrawAutosaveResult {
  status: TldrawAutosaveStatus
  lastSavedAt: Date | null
  saveNow: () => Promise<void>
}

export function useTldrawAutosave({
  changeVersion,
  canSave,
  fileKey,
  delayMs = 2000,
  saveDrawing,
}: UseTldrawAutosaveParams): UseTldrawAutosaveResult {
  const [status, setStatus] = useState<TldrawAutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const savedVersionRef = useRef(changeVersion)
  const latestVersionRef = useRef(changeVersion)
  const saveDrawingRef = useRef(saveDrawing)
  const timerRef = useRef<number | null>(null)
  const isSavingRef = useRef(false)
  const hasQueuedSaveRef = useRef(false)

  latestVersionRef.current = changeVersion
  saveDrawingRef.current = saveDrawing

  const clearPendingSave = useCallback(() => {
    if (!timerRef.current) return
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const runSave = useCallback(async (versionToSave: number, isAutosave: boolean) => {
    clearPendingSave()

    if (!canSave) return

    if (isSavingRef.current) {
      hasQueuedSaveRef.current = true
      setStatus('dirty')
      return
    }

    isSavingRef.current = true
    setStatus('saving')

    try {
      const didSave = await saveDrawingRef.current({ isAutosave })
      if (!didSave) throw new Error('Failed to save drawing')

      savedVersionRef.current = versionToSave
      setLastSavedAt(new Date())
      setStatus('saved')
    } catch {
      setStatus('error')
    } finally {
      isSavingRef.current = false
      const latestVersion = latestVersionRef.current

      if (hasQueuedSaveRef.current && latestVersion !== savedVersionRef.current) {
        hasQueuedSaveRef.current = false
        timerRef.current = window.setTimeout(() => {
          void runSave(latestVersion, true)
        }, delayMs)
      }
    }
  }, [canSave, clearPendingSave, delayMs])

  useEffect(() => {
    clearPendingSave()
    savedVersionRef.current = latestVersionRef.current
    hasQueuedSaveRef.current = false
    isSavingRef.current = false
    setLastSavedAt(null)
    setStatus('idle')
  }, [clearPendingSave, fileKey])

  useEffect(() => {
    if (!canSave) return
    if (changeVersion === savedVersionRef.current) return

    setStatus('dirty')
    clearPendingSave()
    timerRef.current = window.setTimeout(() => {
      void runSave(changeVersion, true)
    }, delayMs)

    return clearPendingSave
  }, [canSave, changeVersion, clearPendingSave, delayMs, runSave])

  useEffect(() => clearPendingSave, [clearPendingSave])

  const saveNow = useCallback(async () => {
    await runSave(changeVersion, false)
  }, [changeVersion, runSave])

  return {
    status,
    lastSavedAt,
    saveNow,
  }
}
