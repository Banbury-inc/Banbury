import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'
import { DatabaseTreeNode, OpenDatabaseTablePayload } from '../types'

export function handleTreeNodeSelect(
  node: DatabaseTreeNode,
  connection: DatabaseConnectionConfig
): OpenDatabaseTablePayload | null {
  if (node.nodeType === 'table' && node.table && node.database) {
    return {
      provider: connection.provider,
      connection,
      database: node.database,
      schema: node.schema,
      table: node.table,
    }
  }

  if (node.nodeType === 'collection' && node.collection && node.database) {
    return {
      provider: connection.provider,
      connection,
      database: node.database,
      collection: node.collection,
    }
  }

  return null
}
