import { ApiService } from '../apiService'

export type DatabaseProvider = 'postgres' | 'mysql' | 'mongodb'

export interface DatabaseConnectionPayload {
  provider: DatabaseProvider
  host: string
  port: number
  username: string
  password: string
  database?: string
}

export interface DatabaseTreeNode {
  id: string
  label: string
  nodeType: 'database' | 'schema' | 'table' | 'collection'
  hasChildren: boolean
  database?: string
  schema?: string
  table?: string
  collection?: string
  children?: DatabaseTreeNode[]
}

interface ConnectionTestResponse {
  success: boolean
  error?: string
}

interface TreeResponse {
  success: boolean
  tree?: DatabaseTreeNode[]
  error?: string
}

interface TableDataResponse {
  success: boolean
  columns?: string[]
  rows?: Record<string, unknown>[]
  page?: number
  pageSize?: number
  totalCount?: number
  error?: string
}

export default class Databases {
  constructor(_apiService: ApiService) {}

  static async testConnection(connection: DatabaseConnectionPayload): Promise<{ success: boolean; error?: string }> {
    const response = await ApiService.post<ConnectionTestResponse>('/databases/connections/test/', {
      connection,
    })

    if (!response.success) return { success: false, error: response.error || 'Connection failed' }
    return { success: true }
  }

  static async loadTree(connection: DatabaseConnectionPayload): Promise<{ tree: DatabaseTreeNode[]; error?: string }> {
    const response = await ApiService.post<TreeResponse>('/databases/tree/', {
      connection,
    })

    if (!response.success || !response.tree) return { tree: [], error: response.error || 'Unable to load tree' }
    return { tree: response.tree }
  }

  static async loadTableData(params: {
    connection: DatabaseConnectionPayload
    target: {
      database: string
      schema?: string
      table?: string
      collection?: string
    }
    page: number
    pageSize: number
  }): Promise<{
    columns: string[]
    rows: Record<string, unknown>[]
    page: number
    pageSize: number
    totalCount: number
    error?: string
  }> {
    const response = await ApiService.post<TableDataResponse>('/databases/table-data/', params)

    if (!response.success) {
      return {
        columns: [],
        rows: [],
        page: params.page,
        pageSize: params.pageSize,
        totalCount: 0,
        error: response.error || 'Unable to load table data',
      }
    }

    return {
      columns: response.columns || [],
      rows: response.rows || [],
      page: response.page || params.page,
      pageSize: response.pageSize || params.pageSize,
      totalCount: response.totalCount || 0,
    }
  }
}
