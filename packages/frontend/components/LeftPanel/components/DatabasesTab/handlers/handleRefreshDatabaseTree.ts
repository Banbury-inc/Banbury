import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'
import { DatabaseTreeNode } from '../types'
import { handleLoadTree } from './handleLoadTree'

interface HandleRefreshDatabaseTreeParams {
  activeConnection: DatabaseConnectionConfig
  setIsRefreshing: React.Dispatch<React.SetStateAction<boolean>>
  setTree: React.Dispatch<React.SetStateAction<DatabaseTreeNode[]>>
  toast: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
}

export async function handleRefreshDatabaseTree({
  activeConnection,
  setIsRefreshing,
  setTree,
  toast,
}: HandleRefreshDatabaseTreeParams): Promise<void> {
  setIsRefreshing(true)
  const treeResult = await handleLoadTree(activeConnection)

  if (treeResult.error) {
    toast({
      title: 'Refresh failed',
      description: treeResult.error,
      variant: 'destructive',
    })
    setIsRefreshing(false)
    return
  }

  setTree(treeResult.tree)
  setIsRefreshing(false)
}
