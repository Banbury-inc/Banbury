import * as ContextMenu from '@radix-ui/react-context-menu'
import { ChevronRight, Database, Pencil, Plus, RefreshCw, Trash2, Type } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '../../../common/ui/button'
import { Typography } from '../../../common/ui/typography'
import { DatabaseConnectionConfig } from '../../../../../pages/Workspaces/types'
import { AddDatabasePopover } from './AddDatabasePopover'
import {
  buildConnectionName,
  deleteSavedConnection,
  loadSavedConnections,
  renameConnection,
  saveConnection,
} from './handlers/handleSaveDatabaseConnection'
import { handleDatabaseNodeSelection } from './handlers/handleDatabaseNodeSelection'
import { handleRefreshDatabaseTree } from './handlers/handleRefreshDatabaseTree'
import { DatabaseTreeNode, OpenDatabaseTablePayload, SavedDatabaseConnection } from './types'

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
  const [savedConnections, setSavedConnections] = useState<SavedDatabaseConnection[]>([])
  const [activeConnection, setActiveConnection] = useState<DatabaseConnectionConfig | null>(null)
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null)
  const [tree, setTree] = useState<DatabaseTreeNode[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<SavedDatabaseConnection | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSavedConnections().then(setSavedConnections)
  }, [])

  async function handleConnected(connection: DatabaseConnectionConfig, connectedTree: DatabaseTreeNode[]) {
    const name = buildConnectionName(connection)
    const id = `${connection.provider}-${connection.host}-${connection.port}-${connection.database ?? ''}`
    const saved: SavedDatabaseConnection = { id, name, config: connection }
    await saveConnection(saved)
    const updated = await loadSavedConnections()
    setSavedConnections(updated)
    setActiveConnection(connection)
    setActiveConnectionId(id)
    setTree(connectedTree)
  }

  function startRenaming(saved: SavedDatabaseConnection) {
    setRenamingId(saved.id)
    setRenameValue(saved.name)
    setTimeout(() => renameInputRef.current?.select(), 0)
  }

  async function commitRename(saved: SavedDatabaseConnection) {
    const trimmed = renameValue.trim()
    setRenamingId(null)
    if (!trimmed || trimmed === saved.name) return
    await renameConnection(saved, trimmed)
    const updated = await loadSavedConnections()
    setSavedConnections(updated)
  }

  async function handleDeleteConnection(id: string) {
    await deleteSavedConnection(id)
    const updated = await loadSavedConnections()
    setSavedConnections(updated)
    if (activeConnectionId === id) {
      setActiveConnection(null)
      setActiveConnectionId(null)
      setTree([])
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Database className="h-4 w-4" />
            <span>Databases</span>
          </div>
          <div className="flex items-center gap-1">
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
            <AddDatabasePopover
              open={popoverOpen}
              onOpenChange={(open) => {
                setPopoverOpen(open)
                if (!open) setEditingConnection(null)
              }}
              onConnected={handleConnected}
              toast={toast}
              editingConnection={editingConnection}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  title="Add database connection"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {savedConnections.length === 0 ? (
          <div className="px-4 py-4">
            <div className="rounded-md border border-dashed border-border bg-background px-3 py-4 text-center text-xs text-muted-foreground">
              <Database className="mx-auto mb-2 h-5 w-5 opacity-40" />
              <p>No saved connections.</p>
              <button
                type="button"
                className="mt-1 text-xs text-primary underline-offset-2 hover:underline"
                onClick={() => setPopoverOpen(true)}
              >
                Add a database connection
              </button>
            </div>
          </div>
        ) : (
          <div className="px-2 py-2 space-y-1">
            {savedConnections.map(saved => (
              <ContextMenu.Root key={saved.id}>
                <ContextMenu.Trigger asChild>
                  <div
                    className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                      activeConnectionId === saved.id
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    }`}
                    onClick={() => {
                      if (activeConnectionId === saved.id) return
                      setActiveConnection(saved.config)
                      setActiveConnectionId(saved.id)
                      setTree([])
                    }}
                  >
                    <Database className="h-3.5 w-3.5 shrink-0" />
                    {renamingId === saved.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(saved)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(saved)
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 bg-background border border-border rounded px-1 py-0.5 text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-ring"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 truncate font-mono">{saved.name}</span>
                    )}
                    <button
                      type="button"
                      title="Remove connection"
                      className="hidden group-hover:flex items-center text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConnection(saved.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                  <ContextMenu.Content className="min-w-[160px] bg-popover border border-zinc-200 dark:border-zinc-700 rounded-md p-1 shadow-lg z-50">
                    <ContextMenu.Item
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                      onSelect={() => {
                        setEditingConnection(saved)
                        setPopoverOpen(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" strokeWidth={1} />
                      <Typography variant="xs">Edit Connection</Typography>
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                      onSelect={() => startRenaming(saved)}
                    >
                      <Type className="w-4 h-4" strokeWidth={1} />
                      <Typography variant="xs">Rename</Typography>
                    </ContextMenu.Item>
                    <ContextMenu.Separator className="h-px bg-sidebar-border my-1" />
                    <ContextMenu.Item
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded cursor-pointer outline-none"
                      onSelect={() => handleDeleteConnection(saved.id)}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1} />
                      <Typography variant="xs" className="text-red-600 dark:text-red-400">
                        Delete
                      </Typography>
                    </ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu.Portal>
              </ContextMenu.Root>
            ))}
          </div>
        )}

        {tree.length > 0 ? (
          <div className="border-t border-border px-2 py-2">
            {tree.map(node => (
              <TreeNodeItem
                key={node.id}
                node={node}
                onSelect={selectedNode => handleDatabaseNodeSelection({
                  node: selectedNode,
                  activeConnection,
                  onOpenDatabaseTable,
                })}
              />
            ))}
          </div>
        ) : activeConnection ? (
          <div className="px-4 py-2 text-xs text-muted-foreground">
            Tree not loaded. Click refresh to load.
          </div>
        ) : null}
      </div>

    </div>
  )
}
