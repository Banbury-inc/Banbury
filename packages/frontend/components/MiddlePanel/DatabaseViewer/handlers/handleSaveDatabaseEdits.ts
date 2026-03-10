import { ApiService } from '../../../../../backend/api/apiService'
import { DatabaseTableTab } from '../../../../pages/Workspaces/types'

interface SaveEditsParams {
  tab: DatabaseTableTab
  rows: Record<string, unknown>[]
  editedCells: Map<number, Record<string, unknown>>
  newRows: Record<string, unknown>[]
  primaryKeyColumns: string[]
  pageOffset: number
}

interface SaveEditsResult {
  error?: string
}

function buildPrimaryKey(row: Record<string, unknown>, primaryKeyColumns: string[]): Record<string, unknown> {
  const pk: Record<string, unknown> = {}
  for (const col of primaryKeyColumns) {
    pk[col] = row[col]
  }
  return pk
}

export async function handleSaveDatabaseEdits({
  tab,
  rows,
  editedCells,
  newRows,
  primaryKeyColumns,
  pageOffset,
}: SaveEditsParams): Promise<SaveEditsResult> {
  const target = {
    database: tab.database,
    schema: tab.schema,
    table: tab.table,
    collection: tab.collection,
  }

  if (editedCells.size > 0 && primaryKeyColumns.length > 0) {
    const updates = Array.from(editedCells.entries()).map(([rowIndex, changes]) => {
      const originalRow = rows[rowIndex - pageOffset]
      return {
        primaryKey: buildPrimaryKey(originalRow, primaryKeyColumns),
        changes,
      }
    })

    const result = await ApiService.Databases.updateRows({ connection: tab.connection, target, updates })
    if (result.error) return { error: result.error }
  }

  if (newRows.length > 0) {
    const result = await ApiService.Databases.insertRows({ connection: tab.connection, target, rows: newRows })
    if (result.error) return { error: result.error }
  }

  return {}
}
