import axios from 'axios'
import { ApiService } from '../apiService'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: string }).error === 'string')
      return (data as { error: string }).error
    if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: string }).message === 'string')
      return (data as { message: string }).message
    if (data && typeof data === 'string') return data
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export type DatabaseProvider = 'postgres' | 'mysql' | 'mongodb'

export interface DatabaseSshPayload {
  enabled: boolean
  host: string
  port: number
  username: string
  authMethod: 'password' | 'publicKey'
  password?: string
  privateKey?: string
  passphrase?: string
}

export interface DatabaseConnectionPayload {
  provider: DatabaseProvider
  uri?: string
  host: string
  port: number
  username: string
  password: string
  database?: string
  ssh?: DatabaseSshPayload
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

export interface SavedConnectionRecord {
  id: string
  name: string
  config: DatabaseConnectionPayload
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
  primaryKeyColumns?: string[]
  error?: string
}

interface UpdateRowsResponse {
  success: boolean
  error?: string
}

interface InsertRowsResponse {
  success: boolean
  error?: string
}

interface SaveConnectionResponse {
  success: boolean
  connection?: SavedConnectionRecord
  error?: string
}

interface ListConnectionsResponse {
  success: boolean
  connections?: SavedConnectionRecord[]
  error?: string
}

export default class Databases {
  constructor(_apiService: ApiService) {}

  static async testConnection(connection: DatabaseConnectionPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await ApiService.post<ConnectionTestResponse>('/databases/connections/test/', {
        connection,
      })
      if (!response.success) return { success: false, error: response.error || 'Connection failed' }
      return { success: true }
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'Connection test failed') }
    }
  }

  static async loadTree(connection: DatabaseConnectionPayload): Promise<{ tree: DatabaseTreeNode[]; error?: string }> {
    try {
      const response = await ApiService.post<TreeResponse>('/databases/tree/', {
        connection,
      })
      if (!response.success || !response.tree) return { tree: [], error: response.error || 'Unable to load tree' }
      return { tree: response.tree }
    } catch (error) {
      return { tree: [], error: extractErrorMessage(error, 'Failed to load database tree') }
    }
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
    orderBy?: { column: string; direction: 'asc' | 'desc' }
    filters?: Array<{ column: string; operator: string; value: string }>
  }): Promise<{
    columns: string[]
    rows: Record<string, unknown>[]
    page: number
    pageSize: number
    totalCount: number
    primaryKeyColumns: string[]
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
        primaryKeyColumns: [],
        error: response.error || 'Unable to load table data',
      }
    }

    return {
      columns: response.columns || [],
      rows: response.rows || [],
      page: response.page || params.page,
      pageSize: response.pageSize || params.pageSize,
      totalCount: response.totalCount || 0,
      primaryKeyColumns: response.primaryKeyColumns || [],
    }
  }

  static async updateRows(params: {
    connection: DatabaseConnectionPayload
    target: {
      database: string
      schema?: string
      table?: string
      collection?: string
    }
    updates: Array<{ primaryKey: Record<string, unknown>; changes: Record<string, unknown> }>
  }): Promise<{ error?: string }> {
    const response = await ApiService.post<UpdateRowsResponse>('/databases/update-rows/', params)
    if (!response.success) return { error: response.error || 'Failed to update rows' }
    return {}
  }

  static async insertRows(params: {
    connection: DatabaseConnectionPayload
    target: {
      database: string
      schema?: string
      table?: string
      collection?: string
    }
    rows: Record<string, unknown>[]
  }): Promise<{ error?: string }> {
    const response = await ApiService.post<InsertRowsResponse>('/databases/insert-rows/', params)
    if (!response.success) return { error: response.error || 'Failed to insert rows' }
    return {}
  }

  static async saveConnection(name: string, config: DatabaseConnectionPayload): Promise<{ connection?: SavedConnectionRecord; error?: string }> {
    const response = await ApiService.post<SaveConnectionResponse>('/databases/connections/save/', { name, config })
    if (!response.success) return { error: response.error || 'Failed to save connection' }
    return { connection: response.connection }
  }

  static async listConnections(): Promise<{ connections: SavedConnectionRecord[]; error?: string }> {
    const response = await ApiService.get<ListConnectionsResponse>('/databases/connections/')
    if (!response.success) return { connections: [], error: response.error || 'Failed to load connections' }
    return { connections: response.connections ?? [] }
  }

  static async deleteConnection(connectionId: string): Promise<{ error?: string }> {
    await ApiService.delete<{ success: boolean; error?: string }>(`/databases/connections/${connectionId}/`)
    return {}
  }
}
