import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'
import { DatabaseTreeNode, OpenDatabaseTablePayload } from '../types'
import { handleTreeNodeSelect } from './handleTreeNodeSelect'

interface HandleDatabaseNodeSelectionParams {
  node: DatabaseTreeNode
  activeConnection: DatabaseConnectionConfig | null
  onOpenDatabaseTable: (payload: OpenDatabaseTablePayload) => void
}

export function handleDatabaseNodeSelection({
  node,
  activeConnection,
  onOpenDatabaseTable,
}: HandleDatabaseNodeSelectionParams): void {
  if (!activeConnection) return

  const tabPayload = handleTreeNodeSelect(node, activeConnection)
  if (!tabPayload) return
  onOpenDatabaseTable(tabPayload)
}
