import { DatabaseConnectionConfig, DatabaseProvider, OpenDatabaseTablePayload } from '../../../../../pages/Workspaces/types'

export interface SavedDatabaseConnection {
  id: string
  name: string
  config: DatabaseConnectionConfig
}

export interface DatabaseConnectionFormState {
  provider: DatabaseProvider
  uri: string
  host: string
  port: string
  username: string
  password: string
  database: string
  sshEnabled: boolean
  sshHost: string
  sshPort: string
  sshUsername: string
  sshAuthMethod: 'password' | 'publicKey'
  sshPassword: string
  sshPrivateKey: string
  sshPassphrase: string
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

