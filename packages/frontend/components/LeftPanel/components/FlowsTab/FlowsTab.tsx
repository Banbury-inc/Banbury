import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '../../../common/ui/button'
import { FlowItem, PanelGroup } from '../../../../pages/Workspaces/types'
import { ApiService } from '../../../../../backend/api/apiService'
import { useToast } from '../../../common/ui/use-toast'
import { FlowsListView } from './components/FlowsListView'
import { handleDeleteFlow } from './handlers/handleDeleteFlow'
import { useFlowWorkspaceHandlers } from './handlers/workspaceHandlers'

interface FlowsTabProps {
  selectedFlow?: FlowItem | null
  activePanelId?: string
  panelLayout?: PanelGroup
  setPanelLayout?: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId?: React.Dispatch<React.SetStateAction<string>>
  setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowItem | null>>
  onFlowSelect?: (flow: FlowItem) => void
}

export function FlowsTab({
  selectedFlow,
  activePanelId = 'main-panel',
  panelLayout,
  setPanelLayout,
  setActivePanelId,
  setSelectedFlow: setSelectedFlowProp,
  onFlowSelect,
}: FlowsTabProps) {
  const { toast } = useToast()
  const [flows, setFlows] = useState<FlowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [newFlowName, setNewFlowName] = useState('')

  const workspaceHandlers = useFlowWorkspaceHandlers({
    activePanelId,
    panelLayout: panelLayout ?? null,
    setPanelLayout: setPanelLayout ?? (() => {}),
    setActivePanelId: setActivePanelId ?? (() => {}),
    setSelectedFlow: setSelectedFlowProp ?? (() => {}),
  })

  const handleFlowSelectInternal = onFlowSelect ?? workspaceHandlers?.handleFlowSelect

  const loadFlows = useCallback(async (showErrorToast = false) => {
    setLoading(true)
    try {
      const result = await ApiService.Flows.listFlows()
      setFlows(result)
    } catch {
      if (showErrorToast)
        toast({ title: 'Error', description: 'Failed to load flows', variant: 'destructive' })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    loadFlows()
  }, [loadFlows, refreshCounter])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadFlows(true)
  }

  const handleCreateSubmit = async () => {
    const name = newFlowName.trim() || 'Untitled Flow'
    try {
      const created = await ApiService.Flows.createFlow(name)
      toast({ title: 'Success', description: 'Flow created' })
      setNewFlowName('')
      setIsCreating(false)
      setRefreshCounter(prev => prev + 1)
      if (created && handleFlowSelectInternal) {
        handleFlowSelectInternal(created)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create flow', variant: 'destructive' })
    }
  }

  const closeFlowTabs = useCallback((flowId: string) => {
    if (!setPanelLayout) return
    setPanelLayout((prev: PanelGroup) => {
      const removeFlowTabs = (layout: PanelGroup): PanelGroup => {
        if (layout.type === 'panel' && layout.panel) {
          const filtered = layout.panel.tabs.filter(t => !(t.type === 'flow' && t.flowId === flowId))
          if (filtered.length === layout.panel.tabs.length) return layout
          const activeTabId = filtered.length > 0
            ? (layout.panel.activeTabId && filtered.some(t => t.id === layout.panel!.activeTabId)
                ? layout.panel.activeTabId
                : filtered[filtered.length - 1].id)
            : null
          return { ...layout, panel: { ...layout.panel, tabs: filtered, activeTabId } }
        }
        if (layout.type === 'group' && layout.children)
          return { ...layout, children: layout.children.map(removeFlowTabs) }
        return layout
      }
      return removeFlowTabs(prev)
    })
  }, [setPanelLayout])

  const handleFlowDeleted = useCallback(async (flowId: string) => {
    await handleDeleteFlow({
      flowId,
      onSuccess: () => {
        toast({ title: 'Success', description: 'Flow deleted' })
        closeFlowTabs(flowId)
        setRefreshCounter(prev => prev + 1)
      },
      onError: (message) => {
        toast({ title: 'Error', description: message, variant: 'destructive' })
      },
    })
  }, [toast, closeFlowTabs])

  const handleNewFlowClick = () => {
    setIsCreating(true)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="xs"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh"
          className="hover:bg-accent hover:text-accent-foreground"
        >
          <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin text-muted-foreground' : 'h-4 w-4 text-muted-foreground'} />
        </Button>
        <Button
          variant="secondary"
          size="xs"
          onClick={handleNewFlowClick}
          title="New Flow"
          className="bg-accent hover:bg-accent hover:text-accent-foreground"
        >
          <Plus className="h-4 w-4 text-accent-foreground" strokeWidth={1} />
        </Button>
      </div>

      {isCreating && (
        <div className="px-3 py-2 border-b border-border bg-card flex items-center gap-2">
          <input
            autoFocus
            type="text"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-border placeholder:text-muted-foreground"
            placeholder="Flow name..."
            value={newFlowName}
            onChange={(e) => setNewFlowName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubmit()
              if (e.key === 'Escape') { setIsCreating(false); setNewFlowName('') }
            }}
          />
          <Button size="xs" variant="ghost" onClick={handleCreateSubmit}>
            Create
          </Button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <FlowsListView
          flows={flows}
          loading={loading}
          selectedFlow={selectedFlow}
          onFlowSelect={handleFlowSelectInternal}
          onFlowDeleted={handleFlowDeleted}
        />
      </div>
    </div>
  )
}
