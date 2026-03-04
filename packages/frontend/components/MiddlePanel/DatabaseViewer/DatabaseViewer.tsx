'use client'

import { Copy, PlusCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../common/ui/button'
import { DatabaseTableTab } from '../../../pages/Workspaces/types'
import { ColumnHeaderMenu } from './ColumnHeaderMenu'
import { DatabaseViewerToolbar } from './components/DatabaseViewerToolbar'
import { handleClearAll, handleFilterRemove } from './handlers/handleFilterChange'
import { handleSaveDatabaseEdits } from './handlers/handleSaveDatabaseEdits'
import { ColumnFilter, ColumnOrderBy, loadDatabaseTableData } from './handlers/loadDatabaseTableData'

interface DatabaseViewerProps {
  tab: DatabaseTableTab
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  rowIndex: number
}

function stringifyCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function DatabaseViewer({ tab }: DatabaseViewerProps) {
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [primaryKeyColumns, setPrimaryKeyColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [orderBy, setOrderBy] = useState<ColumnOrderBy | null>(null)
  const [filters, setFilters] = useState<ColumnFilter[]>([])

  const [editedCells, setEditedCells] = useState<Map<number, Record<string, unknown>>>(new Map())
  const [newRows, setNewRows] = useState<Record<string, unknown>[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [refreshCounter, setRefreshCounter] = useState(0)

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    rowIndex: -1,
  })
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const isDirty = editedCells.size > 0 || newRows.length > 0
  const pageOffset = (page - 1) * pageSize

  const totalPages = useMemo(() => {
    if (totalCount <= 0) return 1
    return Math.max(1, Math.ceil(totalCount / pageSize))
  }, [totalCount, pageSize])

  useEffect(() => {
    setPage(1)
    setOrderBy(null)
    setFilters([])
    setEditedCells(new Map())
    setNewRows([])
    setEditingCell(null)
  }, [tab.provider, tab.database, tab.schema, tab.table, tab.collection])

  useEffect(() => {
    let isCancelled = false

    async function fetchData() {
      setIsLoading(true)
      setErrorMessage(null)
      const result = await loadDatabaseTableData(tab, page, pageSize, orderBy, filters).catch(() => ({
        columns: [],
        rows: [],
        page,
        pageSize,
        totalCount: 0,
        primaryKeyColumns: [],
        error: 'Unable to fetch table data',
      }))

      if (isCancelled) return

      if (result.error) {
        setErrorMessage(result.error)
        setColumns([])
        setRows([])
        setTotalCount(0)
        setPrimaryKeyColumns([])
        setIsLoading(false)
        return
      }

      setColumns(result.columns)
      setRows(result.rows)
      setTotalCount(result.totalCount)
      setPrimaryKeyColumns(result.primaryKeyColumns)
      setIsLoading(false)
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [tab, page, pageSize, orderBy, filters, refreshCounter])

  useEffect(() => {
    if (!contextMenu.visible) return

    function handleClickOutside(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node))
        setContextMenu(prev => ({ ...prev, visible: false }))
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setContextMenu(prev => ({ ...prev, visible: false }))
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu.visible])

  function getCellDisplayValue(rowIndex: number, column: string, row: Record<string, unknown>): string {
    const rowEdits = editedCells.get(pageOffset + rowIndex)
    if (rowEdits && column in rowEdits) return stringifyCellValue(rowEdits[column])
    return stringifyCellValue(row[column])
  }

  function handleCellClick(rowIndex: number, column: string, row: Record<string, unknown>) {
    const currentValue = getCellDisplayValue(rowIndex, column, row)
    setEditingCell({ rowIndex, column })
    setEditValue(currentValue)
  }

  function commitCellEdit(rowIndex: number, column: string, value: string) {
    const absoluteIndex = pageOffset + rowIndex
    setEditedCells(prev => {
      const next = new Map(prev)
      const existing = next.get(absoluteIndex) ?? {}
      next.set(absoluteIndex, { ...existing, [column]: value })
      return next
    })
    setEditingCell(null)
  }

  function handleEditKeyDown(e: React.KeyboardEvent, rowIndex: number, column: string) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitCellEdit(rowIndex, column, editValue)
    }
    if (e.key === 'Escape') setEditingCell(null)
  }

  function handleOrderByChange(newOrderBy: ColumnOrderBy | null) {
    setPage(1)
    setOrderBy(newOrderBy)
  }

  function handleFiltersChange(newFilters: ColumnFilter[]) {
    setPage(1)
    setFilters(newFilters)
  }

  function handleRemoveFilter(column: string) {
    setPage(1)
    setFilters(prev => handleFilterRemove(prev, column))
  }

  function handleClearAllFiltersAndSort() {
    const cleared = handleClearAll()
    setPage(1)
    setOrderBy(cleared.orderBy)
    setFilters(cleared.filters)
  }

  function handleRowNumberContextMenu(e: React.MouseEvent, rowIndex: number) {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, rowIndex })
  }

  function handleAddRow() {
    const emptyRow: Record<string, unknown> = {}
    for (const col of columns) emptyRow[col] = ''
    setNewRows(prev => [...prev, emptyRow])
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  function handleDuplicateRow() {
    const { rowIndex } = contextMenu
    const localIndex = rowIndex - pageOffset
    const sourceRow = localIndex < rows.length
      ? { ...rows[localIndex] }
      : { ...newRows[localIndex - rows.length] }

    const copy: Record<string, unknown> = {}
    for (const key of Object.keys(sourceRow)) {
      if (!primaryKeyColumns.includes(key)) copy[key] = sourceRow[key]
    }
    setNewRows(prev => [...prev, copy])
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  function handleCancelEdits() {
    setEditedCells(new Map())
    setNewRows([])
    setEditingCell(null)
  }

  const handleRefresh = useCallback(() => {
    setEditedCells(new Map())
    setNewRows([])
    setEditingCell(null)
    setRefreshCounter(c => c + 1)
    setPage(1)
  }, [])

  async function handleSave() {
    setIsSaving(true)
    const result = await handleSaveDatabaseEdits({
      tab,
      rows,
      editedCells,
      newRows,
      primaryKeyColumns,
      pageOffset,
    })
    setIsSaving(false)
    if (result.error) {
      setErrorMessage(result.error)
      return
    }
    setEditedCells(new Map())
    setNewRows([])
    setRefreshCounter(c => c + 1)
  }

  function handleNewRowCellClick(newRowIndex: number, column: string) {
    const virtualRowIndex = rows.length + newRowIndex
    const currentValue = stringifyCellValue(newRows[newRowIndex]?.[column])
    setEditingCell({ rowIndex: virtualRowIndex, column })
    setEditValue(currentValue)
  }

  function commitNewRowCellEdit(newRowIndex: number, column: string, value: string) {
    setNewRows(prev => {
      const next = [...prev]
      next[newRowIndex] = { ...next[newRowIndex], [column]: value }
      return next
    })
    setEditingCell(null)
  }

  const allRows = [...rows, ...newRows]

  return (
    <div className="h-full flex flex-col bg-background">
      <DatabaseViewerToolbar
        tableName={tab.table ?? tab.collection ?? ''}
        provider={tab.provider}
        database={tab.database}
        schema={tab.schema}
        totalCount={totalCount}
        isDirty={isDirty}
        isSaving={isSaving}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onSave={handleSave}
        onCancel={handleCancelEdits}
      />

      {(filters.length > 0 || orderBy) && (
        <div className="border-b border-border px-4 py-2 flex flex-wrap items-center gap-1.5">
          {orderBy && (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-foreground">
              Sort: {orderBy.column} {orderBy.direction.toUpperCase()}
              <button
                type="button"
                className="ml-0.5 hover:text-destructive"
                onClick={() => setOrderBy(null)}
                aria-label="Remove sort"
              >
                ×
              </button>
            </span>
          )}
          {filters.map(f => (
            <span
              key={f.column}
              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-foreground"
            >
              {f.column} {f.operator} {f.value}
              <button
                type="button"
                className="ml-0.5 hover:text-destructive"
                onClick={() => handleRemoveFilter(f.column)}
                aria-label={`Remove filter on ${f.column}`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
            onClick={handleClearAllFiltersAndSort}
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading table data...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="h-full flex items-center justify-center px-4">
            <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && columns.length === 0 && (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No data available.
          </div>
        )}

        {!isLoading && !errorMessage && columns.length > 0 && (
          <table className="min-w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-card">
              <tr>
                <th className="border-b border-r border-border px-2 py-2 text-center text-muted-foreground font-normal w-10 min-w-[2.5rem]">
                  #
                </th>
                {columns.map(column => (
                  <th
                    key={column}
                    className="border-b border-border px-3 py-2 text-left"
                  >
                    <ColumnHeaderMenu
                      column={column}
                      orderBy={orderBy}
                      filters={filters}
                      onOrderByChange={handleOrderByChange}
                      onFiltersChange={handleFiltersChange}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const absoluteIndex = pageOffset + rowIndex
                const rowEdits = editedCells.get(absoluteIndex)
                const isRowEdited = !!rowEdits
                return (
                  <tr
                    key={`${tab.id}-row-${rowIndex}`}
                    className={isRowEdited ? 'bg-yellow-500/10' : 'odd:bg-background even:bg-card'}
                  >
                    <td
                      className="border-b border-r border-border px-2 py-1.5 text-center text-muted-foreground select-none cursor-context-menu w-10 min-w-[2.5rem]"
                      onContextMenu={e => handleRowNumberContextMenu(e, absoluteIndex)}
                    >
                      {absoluteIndex + 1}
                    </td>
                    {columns.map(column => {
                      const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.column === column
                      const isCellEdited = rowEdits && column in rowEdits
                      return (
                        <td
                          key={`${column}-${rowIndex}`}
                          className={[
                            'border-b border-border px-3 py-1.5 align-middle text-foreground cursor-pointer overflow-hidden max-w-xs',
                            isCellEdited ? 'bg-yellow-500/15' : '',
                          ].join(' ')}
                          onClick={() => !isEditing && handleCellClick(rowIndex, column, row)}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              className="w-full bg-background border border-primary rounded px-1 py-0.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary min-w-[4rem]"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => commitCellEdit(rowIndex, column, editValue)}
                              onKeyDown={e => handleEditKeyDown(e, rowIndex, column)}
                            />
                          ) : (
                            <span className="block truncate whitespace-nowrap">
                              {getCellDisplayValue(rowIndex, column, row)}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {newRows.map((newRow, newRowIndex) => {
                const virtualRowIndex = rows.length + newRowIndex
                const absoluteIndex = pageOffset + rows.length + newRowIndex
                return (
                  <tr key={`${tab.id}-new-row-${newRowIndex}`} className="bg-green-500/10">
                    <td
                      className="border-b border-r border-border px-2 py-1.5 text-center text-muted-foreground select-none cursor-context-menu w-10 min-w-[2.5rem]"
                      onContextMenu={e => handleRowNumberContextMenu(e, absoluteIndex)}
                    >
                      {absoluteIndex + 1}
                    </td>
                    {columns.map(column => {
                      const isEditing = editingCell?.rowIndex === virtualRowIndex && editingCell?.column === column
                      return (
                        <td
                          key={`new-${column}-${newRowIndex}`}
                          className="border-b border-border px-3 py-1.5 align-middle text-foreground cursor-pointer overflow-hidden max-w-xs"
                          onClick={() => !isEditing && handleNewRowCellClick(newRowIndex, column)}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              className="w-full bg-background border border-primary rounded px-1 py-0.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary min-w-[4rem]"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => commitNewRowCellEdit(newRowIndex, column, editValue)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  commitNewRowCellEdit(newRowIndex, column, editValue)
                                }
                                if (e.key === 'Escape') setEditingCell(null)
                              }}
                            />
                          ) : (
                            <span className="block truncate whitespace-nowrap">
                              {stringifyCellValue(newRow[column])}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-border px-4 py-2 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
          {allRows.length > 0 && (
            <span className="ml-2">
              ({allRows.length} row{allRows.length !== 1 ? 's' : ''} shown)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setPage(previous => Math.max(1, previous - 1))}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setPage(previous => Math.min(totalPages, previous + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-40 bg-card border border-border rounded-md shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-muted text-foreground transition-colors"
            onClick={handleAddRow}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add Row
          </button>
          <button
            type="button"
            className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-muted text-foreground transition-colors"
            onClick={handleDuplicateRow}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate Row
          </button>
        </div>
      )}
    </div>
  )
}
