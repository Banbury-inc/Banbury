import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'
import { DatabaseConnectionFormState, DatabaseTreeNode } from '../types'
import { buildConnectionConfig } from './buildConnectionConfig'
import { handleConnectionTest } from './handleConnectionTest'
import { handleLoadTree } from './handleLoadTree'

interface HandleConnectDatabaseParams {
  formState: DatabaseConnectionFormState
  setIsConnecting: React.Dispatch<React.SetStateAction<boolean>>
  toast: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
  onSuccess: (connection: DatabaseConnectionConfig, tree: DatabaseTreeNode[]) => void
}

export async function handleConnectDatabase({
  formState,
  setIsConnecting,
  toast,
  onSuccess,
}: HandleConnectDatabaseParams): Promise<void> {
  setIsConnecting(true)
  const connection = buildConnectionConfig(formState)

  const testResult = await handleConnectionTest(connection).catch(() => ({
    success: false,
    error: 'Connection test failed',
  }))

  if (!testResult.success) {
    toast({
      title: 'Connection failed',
      description: testResult.error || 'Please verify connection details.',
      variant: 'destructive',
    })
    setIsConnecting(false)
    return
  }

  const treeResult = await handleLoadTree(connection).catch(() => ({
    tree: [],
    error: 'Failed to load database tree',
  }))

  if (treeResult.error) {
    toast({
      title: 'Unable to load tree',
      description: treeResult.error,
      variant: 'destructive',
    })
    setIsConnecting(false)
    return
  }

  setIsConnecting(false)
  toast({
    title: 'Connected',
    description: 'Database tree loaded successfully.',
    variant: 'success',
  })
  onSuccess(connection, treeResult.tree)
}
