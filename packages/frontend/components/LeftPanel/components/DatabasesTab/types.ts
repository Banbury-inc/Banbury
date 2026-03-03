import { DatabaseConnectionConfig, DatabaseProvider, OpenDatabaseTablePayload } from '../../../../../pages/Workspaces/types'

export interface DatabaseConnectionFormState {
  provider: DatabaseProvider
  host: string
  port: string
  username: string
  password: string
  database: string
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

