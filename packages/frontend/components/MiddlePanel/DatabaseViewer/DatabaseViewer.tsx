'use client'

import * as ContextMenu from '@radix-ui/react-context-menu'
import { Copy, Database, PlusCircle, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '../../common/ui/button'
import { Skeleton } from '../../common/ui/skeleton'
import { useToast } from '../../common/ui/use-toast'
import { DatabaseTableTab } from '../../../pages/Workspaces/types'
import { ColumnHeaderMenu } from './ColumnHeaderMenu'
import { DatabaseViewerToolbar } from './components/DatabaseViewerToolbar'
import { handleKeyboardNavigation } from './handlers/handleKeyboardNavigation'
import { handleClearAll, handleFilterRemove } from './handlers/handleFilterChange'
import { handleSaveDatabaseEdits } from './handlers/handleSaveDatabaseEdits'
import { ColumnFilter, ColumnOrderBy, loadDatabaseTableData } from './handlers/loadDatabaseTableData'
import { useDatabaseEditState } from './hooks/useDatabaseEditState'

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250]

interface DatabaseViewerProps {
  tab: DatabaseTableTab
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
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [primaryKeyColumns, setPrimaryKeyColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [orderBy, setOrderBy] = useState<ColumnOrderBy | null>(null)
  const [filters, setFilters] = useState<ColumnFilter[]>([])
  const [refreshCounter, setRefreshCounter] = useState(0)

  const {
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
  } = useDatabaseEditState()

  const { toast } = useToast()

  const pageOffset = (page - 1) * pageSize
  const allRows = [...rows, ...newRows]

  const totalPages = useMemo(() => {
    if (totalCount <= 0) return 1
    return Math.max(1, Math.ceil(totalCount / pageSize))
  }, [totalCount, pageSize])

  useEffect(() => {
    setPage(1)
    setOrderBy(null)
    setFilters([])
    resetEditState()
  }, [tab.provider, tab.database, tab.schema, tab.table, tab.collection, resetEditState])

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

  function getCellDisplayValue(virtualRowIndex: number, column: string): string {
    if (virtualRowIndex < rows.length) {
      const absoluteIndex = pageOffset + virtualRowIndex
      const rowEdits = editedCells.get(absoluteIndex)
      if (rowEdits && column in rowEdits) return stringifyCellValue(rowEdits[column])
      return stringifyCellValue(rows[virtualRowIndex]?.[column])
    }
    const newRowIndex = virtualRowIndex - rows.length
    return stringifyCellValue(newRows[newRowIndex]?.[column])
  }

  function commitEdit(virtualRowIndex: number, column: string, value: string) {
    if (virtualRowIndex < rows.length) {
      const originalDisplayValue = stringifyCellValue(rows[virtualRowIndex]?.[column])
      commitCellEdit(pageOffset + virtualRowIndex, column, value, originalDisplayValue)
    } else {
      commitNewRowCellEdit(virtualRowIndex - rows.length, column, value)
    }
  }

  function handleCellClick(virtualRowIndex: number, column: string) {
    setEditingCell({ rowIndex: virtualRowIndex, column })
    setEditValue(getCellDisplayValue(virtualRowIndex, column))
  }

  function handleEditKeyDown(e: React.KeyboardEvent, virtualRowIndex: number, column: string) {
    if (e.key === 'Escape') {
      setEditingCell(null)
      return
    }
    handleKeyboardNavigation({
      e,
      rowIndex: virtualRowIndex,
      column,
      columns,
      totalRows: allRows.length,
      editValue,
      commitCellEdit: commitEdit,
      setEditingCell,
      setEditValue,
      getDisplayValue: getCellDisplayValue,
    })
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

  function handleAddRow() {
    const emptyRow: Record<string, unknown> = {}
    for (const col of columns) emptyRow[col] = ''
    setNewRows(prev => [...prev, emptyRow])
  }

  function handleDuplicateRow(virtualRowIndex: number) {
    const sourceRow = { ...allRows[virtualRowIndex] }
    const copy: Record<string, unknown> = {}
    for (const key of Object.keys(sourceRow)) {
      if (!primaryKeyColumns.includes(key)) copy[key] = sourceRow[key]
    }
    setNewRows(prev => [...prev, copy])
  }

  function handleCancelEdits() {
    resetEditState()
  }

  const handleRefresh = useCallback(() => {
    resetEditState()
    setRefreshCounter(c => c + 1)
    setPage(1)
  }, [resetEditState])

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
      toast({
        title: 'Failed to save changes',
        description: result.error,
        variant: 'destructive',
      })
      return
    }
    toast({
      title: 'Changes saved',
      description: 'Your edits have been saved successfully.',
      variant: 'success',
    })
    resetEditState()
    setRefreshCounter(c => c + 1)
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize)
    setPage(1)
  }

  const skeletonColumns = columns.length > 0 ? columns : Array(5).fill('')

  return (
    <div className="h-full flex flex-col bg-background">
      <DatabaseViewerToolbar
        tableName={tab.table ?? tab.collection ?? ''}
        provider={tab.provider}
        database={tab.database}
        schema={tab.schema}
        isDirty={isDirty}
        isSaving={isSaving}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onSave={handleSave}
        onCancel={handleCancelEdits}
        onAddRow={handleAddRow}
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
          <table className="min-w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-card">
              <tr>
                <th className="border-b border-r border-border px-2 py-2 w-10 min-w-[2.5rem]">
                  <Skeleton className="h-3.5 w-4 mx-auto" />
                </th>
                {skeletonColumns.map((_, i) => (
                  <th key={i} className="border-b border-border px-3 py-2">
                    <Skeleton className="h-3.5 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-card'}>
                  <td className="border-b border-r border-border px-2 py-1.5">
                    <Skeleton className="h-3 w-4 mx-auto" />
                  </td>
                  {skeletonColumns.map((_, j) => (
                    <td key={j} className="border-b border-border px-3 py-1.5">
                      <Skeleton className={`h-3 ${j % 3 === 0 ? 'w-12' : j % 3 === 1 ? 'w-24' : 'w-16'}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && errorMessage && (
          <div className="h-full flex items-center justify-center px-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-destructive max-w-sm">
                {errorMessage}
              </div>
              <p className="text-xs text-muted-foreground">Check your connection or permissions.</p>
              <Button type="button" size="xs" variant="outline" onClick={handleRefresh} className="gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && columns.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
            <Database className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">This table is empty</p>
              <p className="text-xs text-muted-foreground mt-1">No rows have been added yet.</p>
            </div>
            <Button type="button" size="xs" variant="outline" onClick={handleAddRow} className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              Add your first row
            </Button>
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
                      primaryKeyColumns={primaryKeyColumns}
                      onOrderByChange={handleOrderByChange}
                      onFiltersChange={handleFiltersChange}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRows.map((_, virtualRowIndex) => {
                const isNewRow = virtualRowIndex >= rows.length
                const absoluteIndex = isNewRow ? -1 : pageOffset + virtualRowIndex
                const rowEdits = isNewRow ? undefined : editedCells.get(absoluteIndex)
                const isRowEdited = !isNewRow && !!rowEdits
                return (
                  <tr
                    key={isNewRow
                      ? `${tab.id}-new-row-${virtualRowIndex - rows.length}`
                      : `${tab.id}-row-${virtualRowIndex}`}
                    className={
                      isNewRow
                        ? 'bg-row-new'
                        : isRowEdited
                        ? 'bg-row-edited'
                        : virtualRowIndex % 2 === 0 ? 'bg-background' : 'bg-card'
                    }
                  >
                    <ContextMenu.Root>
                      <ContextMenu.Trigger asChild>
                        <td className="border-b border-r border-border px-2 py-1.5 text-center text-muted-foreground select-none cursor-context-menu w-10 min-w-[2.5rem]">
                          {isNewRow
                            ? <span className="text-muted-foreground/50">+</span>
                            : absoluteIndex + 1}
                        </td>
                      </ContextMenu.Trigger>
                      <ContextMenu.Portal>
                        <ContextMenu.Content className="z-50 min-w-[10rem] bg-popover border border-border rounded-md shadow-md py-1">
                          <ContextMenu.Item
                            className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer select-none outline-none data-[highlighted]:bg-muted text-foreground"
                            onClick={handleAddRow}
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Add Row
                          </ContextMenu.Item>
                          {!isNewRow && (
                            <ContextMenu.Item
                              className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer select-none outline-none data-[highlighted]:bg-muted text-foreground"
                              onClick={() => handleDuplicateRow(virtualRowIndex)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Duplicate Row
                            </ContextMenu.Item>
                          )}
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    </ContextMenu.Root>
                    {columns.map(column => {
                      const isEditing = editingCell?.rowIndex === virtualRowIndex && editingCell?.column === column
                      const isCellEdited = !isNewRow && rowEdits && column in rowEdits
                      return (
                        <td
                          key={`${isNewRow ? 'new-' : ''}${column}-${virtualRowIndex}`}
                          className={[
                            'border-b border-border px-3 py-1.5 align-middle text-foreground cursor-pointer overflow-hidden max-w-xs',
                            isCellEdited ? 'bg-cell-edited' : '',
                          ].join(' ')}
                          onClick={() => !isEditing && handleCellClick(virtualRowIndex, column)}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              className="w-full bg-background border border-primary rounded px-1 py-0.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary min-w-[4rem]"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(virtualRowIndex, column, editValue)}
                              onKeyDown={e => handleEditKeyDown(e, virtualRowIndex, column)}
                            />
                          ) : (
                            <span className="block truncate whitespace-nowrap">
                              {getCellDisplayValue(virtualRowIndex, column)}
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

      <div className="border-t border-border px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <span>{totalCount.toLocaleString()} rows total</span>
          {newRows.length > 0 && (
            <span className="text-foreground">· {newRows.length} unsaved</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => handlePageSizeChange(Number(e.target.value))}
            className="text-xs rounded border border-border bg-background text-foreground px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <div className="w-px h-4 bg-border mx-0.5" />

          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setPage(previous => Math.max(1, previous - 1))}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={e => {
                const val = Number(e.target.value)
                if (val >= 1 && val <= totalPages) setPage(val)
              }}
              className="w-10 text-center text-xs rounded border border-border bg-background text-foreground px-1 py-0.5 outline-none focus:ring-1 focus:ring-ring"
            />
            <span>of {totalPages}</span>
          </div>

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
    </div>
  )
}
