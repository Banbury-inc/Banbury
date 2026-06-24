import { useCallback, useEffect, useRef, useState } from 'react'

export type SpreadsheetAutosaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface SaveSpreadsheetOptions {
  isAutosave: boolean
}

interface UseSpreadsheetAutosaveParams {
  snapshotKey: string
  canSave: boolean
  fileKey: string
  delayMs?: number
  saveSpreadsheet: (options: SaveSpreadsheetOptions) => Promise<void>
}

interface UseSpreadsheetAutosaveResult {
  status: SpreadsheetAutosaveStatus
  lastSavedAt: Date | null
  saveNow: () => Promise<void>
}

export function useSpreadsheetAutosave({
  snapshotKey,
  canSave,
  fileKey,
  delayMs = 2000,
  saveSpreadsheet,
}: UseSpreadsheetAutosaveParams): UseSpreadsheetAutosaveResult {
  const [status, setStatus] = useState<SpreadsheetAutosaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const savedSnapshotRef = useRef<string | null>(null)
  const latestSnapshotRef = useRef(snapshotKey)
  const saveSpreadsheetRef = useRef(saveSpreadsheet)
  const timerRef = useRef<number | null>(null)
  const isSavingRef = useRef(false)
  const hasQueuedSaveRef = useRef(false)

  latestSnapshotRef.current = snapshotKey
  saveSpreadsheetRef.current = saveSpreadsheet

  const clearPendingSave = useCallback(() => {
    if (!timerRef.current) return
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const runSave = useCallback(async (snapshotToSave: string, isAutosave: boolean) => {
    clearPendingSave()

    if (!canSave || !snapshotToSave) return

    if (isSavingRef.current) {
      hasQueuedSaveRef.current = true
      setStatus('dirty')
      return
    }

    isSavingRef.current = true
    setStatus('saving')

    try {
      await saveSpreadsheetRef.current({ isAutosave })
      savedSnapshotRef.current = snapshotToSave
      setLastSavedAt(new Date())
      setStatus('saved')
    } catch {
      setStatus('error')
    } finally {
      isSavingRef.current = false

      const latestSnapshot = latestSnapshotRef.current
      if (hasQueuedSaveRef.current && latestSnapshot !== savedSnapshotRef.current) {
        hasQueuedSaveRef.current = false
        timerRef.current = window.setTimeout(() => {
          void runSave(latestSnapshot, true)
        }, delayMs)
      }
    }
  }, [canSave, clearPendingSave, delayMs])

  useEffect(() => {
    clearPendingSave()
    savedSnapshotRef.current = null
    hasQueuedSaveRef.current = false
    isSavingRef.current = false
    setLastSavedAt(null)
    setStatus('idle')
  }, [clearPendingSave, fileKey])

  useEffect(() => {
    if (!canSave || !snapshotKey) return

    if (savedSnapshotRef.current === null) {
      savedSnapshotRef.current = snapshotKey
      return
    }

    if (snapshotKey === savedSnapshotRef.current) return

    setStatus('dirty')
    clearPendingSave()
    timerRef.current = window.setTimeout(() => {
      void runSave(snapshotKey, true)
    }, delayMs)

    return clearPendingSave
  }, [canSave, clearPendingSave, delayMs, runSave, snapshotKey])

  useEffect(() => clearPendingSave, [clearPendingSave])

  const saveNow = useCallback(async () => {
    await runSave(snapshotKey, false)
  }, [runSave, snapshotKey])

  return {
    status,
    lastSavedAt,
    saveNow,
  }
}
