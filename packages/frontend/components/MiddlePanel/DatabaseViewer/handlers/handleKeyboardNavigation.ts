interface KeyboardNavigationParams {
  e: React.KeyboardEvent
  rowIndex: number
  column: string
  columns: string[]
  totalRows: number
  editValue: string
  commitCellEdit: (rowIndex: number, column: string, value: string) => void
  setEditingCell: (cell: { rowIndex: number; column: string } | null) => void
  setEditValue: (value: string) => void
  getDisplayValue: (rowIndex: number, column: string) => string
}

export function handleKeyboardNavigation({
  e,
  rowIndex,
  column,
  columns,
  totalRows,
  editValue,
  commitCellEdit,
  setEditingCell,
  setEditValue,
  getDisplayValue,
}: KeyboardNavigationParams): void {
  if (e.key !== 'Tab' && e.key !== 'Enter') return

  e.preventDefault()
  commitCellEdit(rowIndex, column, editValue)

  const colIndex = columns.indexOf(column)

  if (e.key === 'Enter') {
    if (rowIndex < totalRows - 1) {
      const nextRow = rowIndex + 1
      setEditingCell({ rowIndex: nextRow, column })
      setEditValue(getDisplayValue(nextRow, column))
    } else {
      setEditingCell(null)
    }
    return
  }

  if (!e.shiftKey) {
    if (colIndex < columns.length - 1) {
      const nextCol = columns[colIndex + 1]
      setEditingCell({ rowIndex, column: nextCol })
      setEditValue(getDisplayValue(rowIndex, nextCol))
    } else if (rowIndex < totalRows - 1) {
      const nextRow = rowIndex + 1
      setEditingCell({ rowIndex: nextRow, column: columns[0] })
      setEditValue(getDisplayValue(nextRow, columns[0]))
    } else {
      setEditingCell(null)
    }
  } else {
    if (colIndex > 0) {
      const prevCol = columns[colIndex - 1]
      setEditingCell({ rowIndex, column: prevCol })
      setEditValue(getDisplayValue(rowIndex, prevCol))
    } else if (rowIndex > 0) {
      const prevRow = rowIndex - 1
      const lastCol = columns[columns.length - 1]
      setEditingCell({ rowIndex: prevRow, column: lastCol })
      setEditValue(getDisplayValue(prevRow, lastCol))
    } else {
      setEditingCell(null)
    }
  }
}
