import { ApiService } from '../../../../../../backend/api/apiService'
import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'
import { SavedDatabaseConnection } from '../types'

export function buildConnectionName(config: DatabaseConnectionConfig): string {
  const db = config.database ? `/${config.database}` : ''
  return `${config.provider}://${config.host}:${config.port}${db}`
}

export async function loadSavedConnections(): Promise<SavedDatabaseConnection[]> {
  const result = await ApiService.Databases.listConnections()
  if (result.error) return []
  return result.connections.map(c => ({
    id: c.id,
    name: c.name,
    config: c.config as unknown as DatabaseConnectionConfig,
  }))
}

export async function saveConnection(connection: SavedDatabaseConnection): Promise<void> {
  await ApiService.Databases.saveConnection(connection.name, connection.config as never)
}

export async function deleteSavedConnection(id: string): Promise<void> {
  await ApiService.Databases.deleteConnection(id)
}

export async function renameConnection(connection: SavedDatabaseConnection, newName: string): Promise<void> {
  await deleteSavedConnection(connection.id)
  await saveConnection({ ...connection, name: newName })
}
