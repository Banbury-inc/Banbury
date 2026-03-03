import { RefreshCw, Database, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '../../../common/ui/button'
import { Input } from '../../../common/ui/input'
import { Label } from '../../../common/ui/label'
import { DatabaseConnectionConfig, DatabaseProvider } from '../../../../../pages/Workspaces/types'
import { handleConnectDatabase } from './handlers/handleConnectDatabase'
import { handleDatabaseNodeSelection } from './handlers/handleDatabaseNodeSelection'
import { handleRefreshDatabaseTree } from './handlers/handleRefreshDatabaseTree'
import { DatabaseConnectionFormState, DatabaseTreeNode, OpenDatabaseTablePayload } from './types'

const providerPorts: Record<DatabaseProvider, string> = {
  postgres: '5432',
  mysql: '3306',
  mongodb: '27017',
}

interface DatabasesTabProps {
  onOpenDatabaseTable: (payload: OpenDatabaseTablePayload) => void
  toast: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
}

interface TreeNodeItemProps {
  node: DatabaseTreeNode
  depth?: number
  onSelect: (node: DatabaseTreeNode) => void
}

function TreeNodeItem({ node, depth = 0, onSelect }: TreeNodeItemProps) {
  const isSelectableLeaf = node.nodeType === 'table' || node.nodeType === 'collection'

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
          isSelectableLeaf
            ? 'text-foreground hover:bg-accent'
            : 'text-muted-foreground hover:bg-accent/60'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.hasChildren ? <ChevronRight className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5" />}
        <span className="truncate">{node.label}</span>
      </button>
      {node.children?.map(child => (
        <TreeNodeItem key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
      ))}
    </div>
  )
}

export function DatabasesTab({ onOpenDatabaseTable, toast }: DatabasesTabProps) {
  const [formState, setFormState] = useState<DatabaseConnectionFormState>({
    provider: 'postgres',
    uri: '',
    host: '',
    port: providerPorts.postgres,
    username: '',
    password: '',
    database: '',
  })
  const [activeConnection, setActiveConnection] = useState<DatabaseConnectionConfig | null>(null)
  const [tree, setTree] = useState<DatabaseTreeNode[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const canConnect = useMemo(() => {
    if (formState.provider === 'mongodb' && formState.uri.trim()) return true
    if (!formState.host.trim()) return false
    if (!formState.port.trim()) return false
    if (!formState.username.trim()) return false
    if (!formState.password.trim()) return false
    return true
  }, [formState])

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Database className="h-4 w-4" />
            <span>Databases</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={!activeConnection || isRefreshing}
            onClick={() => {
              if (!activeConnection) return
              handleRefreshDatabaseTree({
                activeConnection,
                setIsRefreshing,
                setTree,
                toast,
              })
            }}
            title="Refresh tree"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="db-provider" className="text-xs">Provider</Label>
            <select
              id="db-provider"
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
              value={formState.provider}
              onChange={(event) => {
                const provider = event.target.value as DatabaseProvider
                setFormState(prev => ({
                  ...prev,
                  provider,
                  port: providerPorts[provider],
                  uri: provider === 'mongodb' ? prev.uri : '',
                }))
              }}
            >
              <option value="postgres">Postgres</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
            </select>
          </div>
          {formState.provider === 'mongodb' ? (
            <div className="space-y-1 col-span-2">
              <Label htmlFor="db-uri" className="text-xs">MongoDB URI</Label>
              <Input
                id="db-uri"
                value={formState.uri}
                onChange={event => setFormState(prev => ({ ...prev, uri: event.target.value }))}
                placeholder="mongodb+srv://user:password@cluster.mongodb.net/app_db"
                className="h-8 text-xs"
              />
            </div>
          ) : null}
          <div className="space-y-1 col-span-2">
            <Label htmlFor="db-host" className="text-xs">
              {formState.provider === 'mongodb' ? 'Host (optional when URI is set)' : 'Host'}
            </Label>
            <Input
              id="db-host"
              value={formState.host}
              onChange={event => setFormState(prev => ({ ...prev, host: event.target.value }))}
              placeholder="db.example.com"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="db-port" className="text-xs">
              {formState.provider === 'mongodb' ? 'Port (optional when URI is set)' : 'Port'}
            </Label>
            <Input
              id="db-port"
              value={formState.port}
              onChange={event => setFormState(prev => ({ ...prev, port: event.target.value }))}
              placeholder="5432"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="db-database" className="text-xs">Database (optional)</Label>
            <Input
              id="db-database"
              value={formState.database}
              onChange={event => setFormState(prev => ({ ...prev, database: event.target.value }))}
              placeholder="app_db"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="db-username" className="text-xs">
              {formState.provider === 'mongodb' ? 'Username (optional when URI is set)' : 'Username'}
            </Label>
            <Input
              id="db-username"
              value={formState.username}
              onChange={event => setFormState(prev => ({ ...prev, username: event.target.value }))}
              placeholder="readonly_user"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="db-password" className="text-xs">
              {formState.provider === 'mongodb' ? 'Password (optional when URI is set)' : 'Password'}
            </Label>
            <Input
              id="db-password"
              type="password"
              value={formState.password}
              onChange={event => setFormState(prev => ({ ...prev, password: event.target.value }))}
              placeholder="••••••••"
              className="h-8 text-xs"
            />
          </div>
          <div className="col-span-2 pt-1">
            <Button
              type="button"
              className="h-8 w-full text-xs"
              onClick={() =>
                handleConnectDatabase({
                  formState,
                  setIsConnecting,
                  setActiveConnection,
                  setTree,
                  toast,
                })
              }
              disabled={!canConnect || isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {tree.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-background px-3 py-4 text-xs text-muted-foreground">
            Connect to a database to view schemas, tables, and collections.
          </div>
        ) : (
          tree.map(node => (
            <TreeNodeItem
              key={node.id}
              node={node}
              onSelect={selectedNode => handleDatabaseNodeSelection({
                node: selectedNode,
                activeConnection,
                onOpenDatabaseTable,
              })}
            />
          ))
        )}
      </div>
    </div>
  )
}
