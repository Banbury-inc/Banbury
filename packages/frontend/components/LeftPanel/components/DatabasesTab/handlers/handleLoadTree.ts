import { ApiService } from '../../../../../../../backend/api/apiService'
import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'
import { DatabaseTreeNode } from '../types'

export async function handleLoadTree(connection: DatabaseConnectionConfig): Promise<{ tree: DatabaseTreeNode[]; error?: string }> {
  const response = await ApiService.Databases.loadTree(connection)
  return { tree: response.tree, error: response.error }
}
