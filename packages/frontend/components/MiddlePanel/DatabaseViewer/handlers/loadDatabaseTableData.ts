import { ApiService } from '../../../../../backend/api/apiService'
import { DatabaseTableTab } from '../../../../pages/Workspaces/types'

export interface DatabaseTableDataResult {
  columns: string[]
  rows: Record<string, unknown>[]
  page: number
  pageSize: number
  totalCount: number
  error?: string
}

export async function loadDatabaseTableData(tab: DatabaseTableTab, page: number, pageSize: number): Promise<DatabaseTableDataResult> {
  const response = await ApiService.Databases.loadTableData({
    connection: tab.connection,
    target: {
      database: tab.database,
      schema: tab.schema,
      table: tab.table,
      collection: tab.collection,
    },
    page,
    pageSize,
  })

  if (response.error) {
    return {
      columns: [],
      rows: [],
      page,
      pageSize,
      totalCount: 0,
      error: response.error,
    }
  }

  return {
    columns: response.columns || [],
    rows: response.rows || [],
    page: response.page || page,
    pageSize: response.pageSize || pageSize,
    totalCount: response.totalCount || 0,
  }
}
