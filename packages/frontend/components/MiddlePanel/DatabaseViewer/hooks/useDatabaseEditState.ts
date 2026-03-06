import { useCallback, useState } from 'react'

export interface DatabaseEditState {
  editedCells: Map<number, Record<string, unknown>>
  newRows: Record<string, unknown>[]
  setNewRows: React.Dispatch<React.SetStateAction<Record<string, unknown>[]>>
  isSaving: boolean
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>
  editingCell: { rowIndex: number; column: string } | null
  setEditingCell: React.Dispatch<React.SetStateAction<{ rowIndex: number; column: string } | null>>
  editValue: string
  setEditValue: React.Dispatch<React.SetStateAction<string>>
  isDirty: boolean
  resetEditState: () => void
  commitCellEdit: (absoluteIndex: number, column: string, value: string, originalDisplayValue?: string) => void
  commitNewRowCellEdit: (newRowIndex: number, column: string, value: string) => void
}

export function useDatabaseEditState(): DatabaseEditState {
  const [editedCells, setEditedCells] = useState<Map<number, Record<string, unknown>>>(new Map())
  const [newRows, setNewRows] = useState<Record<string, unknown>[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  const isDirty = editedCells.size > 0 || newRows.length > 0

  const resetEditState = useCallback(() => {
    setEditedCells(new Map())
    setNewRows([])
    setEditingCell(null)
  }, [])

  function commitCellEdit(absoluteIndex: number, column: string, value: string, originalDisplayValue?: string) {
    if (originalDisplayValue !== undefined && value === originalDisplayValue) {
      setEditedCells(prev => {
        const existing = prev.get(absoluteIndex)
        if (!existing || !(column in existing)) return prev
        const { [column]: _, ...rest } = existing
        const next = new Map(prev)
        if (Object.keys(rest).length === 0) next.delete(absoluteIndex)
        else next.set(absoluteIndex, rest)
        return next
      })
      setEditingCell(null)
      return
    }
    setEditedCells(prev => {
      const next = new Map(prev)
      const existing = next.get(absoluteIndex) ?? {}
      next.set(absoluteIndex, { ...existing, [column]: value })
      return next
    })
    setEditingCell(null)
  }

  function commitNewRowCellEdit(newRowIndex: number, column: string, value: string) {
    setNewRows(prev => {
      const next = [...prev]
      next[newRowIndex] = { ...next[newRowIndex], [column]: value }
      return next
    })
    setEditingCell(null)
  }

  return {
    editedCells,
    newRows,
    setNewRows,
    isSaving,
    setIsSaving,
    editingCell,
    setEditingCell,
    editValue,
    setEditValue,
    isDirty,
    resetEditState,
    commitCellEdit,
    commitNewRowCellEdit,
  }
}
