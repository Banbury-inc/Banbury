import { useEffect, useMemo, useState } from 'react'

import { Button } from '../../common/ui/button'
import { DatabaseTableTab } from '../../../pages/Workspaces/types'
import { loadDatabaseTableData } from './handlers/loadDatabaseTableData'

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
  const [pageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const totalPages = useMemo(() => {
    if (totalCount <= 0) return 1
    return Math.max(1, Math.ceil(totalCount / pageSize))
  }, [totalCount, pageSize])

  useEffect(() => {
    setPage(1)
  }, [tab.provider, tab.database, tab.schema, tab.table, tab.collection])

  useEffect(() => {
    let isCancelled = false

    async function fetchData() {
      setIsLoading(true)
      setErrorMessage(null)
      const result = await loadDatabaseTableData(tab, page, pageSize).catch(() => ({
        columns: [],
        rows: [],
        page,
        pageSize,
        totalCount: 0,
        error: 'Unable to fetch table data',
      }))

      if (isCancelled) return

      if (result.error) {
        setErrorMessage(result.error)
        setColumns([])
        setRows([])
        setTotalCount(0)
        setIsLoading(false)
        return
      }

      setColumns(result.columns)
      setRows(result.rows)
      setTotalCount(result.totalCount)
      setIsLoading(false)
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [tab, page, pageSize])

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">
            {tab.table || tab.collection}
          </div>
          <div className="text-xs text-muted-foreground">
            {tab.provider} • {tab.database}{tab.schema ? `.${tab.schema}` : ''}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Rows: {totalCount}</div>
      </div>

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
                {columns.map(column => (
                  <th
                    key={column}
                    className="border-b border-border px-3 py-2 text-left font-medium text-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${tab.id}-row-${rowIndex}`} className="odd:bg-background even:bg-card">
                  {columns.map(column => (
                    <td key={`${column}-${rowIndex}`} className="border-b border-border px-3 py-2 align-top text-foreground">
                      {stringifyCellValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-border px-4 py-2 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
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
    </div>
  )
}
