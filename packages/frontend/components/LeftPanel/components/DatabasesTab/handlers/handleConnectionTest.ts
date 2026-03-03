import { ApiService } from '../../../../../../../backend/api/apiService'
import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'

export async function handleConnectionTest(connection: DatabaseConnectionConfig): Promise<{ success: boolean; error?: string }> {
  return ApiService.Databases.testConnection(connection)
}
