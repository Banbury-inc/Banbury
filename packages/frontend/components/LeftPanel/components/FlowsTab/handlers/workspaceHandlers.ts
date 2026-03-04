import { useCallback } from 'react'
import { FlowItem, PanelGroup } from '../../../../../pages/Workspaces/types'
import { openFlowInTab } from '../../../../../pages/Workspaces/handlers/tabManagement'
import { getAllTabs, updatePanelActiveTab, addTabToPanel } from '../../../../../pages/Workspaces/handlers/panelUtils'

interface WorkspaceDependencies {
  activePanelId: string
  panelLayout: PanelGroup | null
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowItem | null>>
}

export function useFlowWorkspaceHandlers(deps: WorkspaceDependencies) {
  const { activePanelId, panelLayout, setPanelLayout, setActivePanelId, setSelectedFlow } = deps
  const hasWorkspaceDeps = panelLayout !== null

  const openFlowInTabCallback = useCallback((flow: FlowItem | null, targetPanelId: string = activePanelId) => {
    if (!hasWorkspaceDeps) return
    openFlowInTab(
      flow,
      targetPanelId,
      panelLayout!,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout
    )
  }, [activePanelId, panelLayout, setActivePanelId, setPanelLayout, hasWorkspaceDeps])

  const handleFlowSelect = useCallback((flow: FlowItem) => {
    if (!hasWorkspaceDeps) return
    setSelectedFlow(flow)
    openFlowInTabCallback(flow)
  }, [setSelectedFlow, openFlowInTabCallback, hasWorkspaceDeps])

  return {
    handleFlowSelect: hasWorkspaceDeps ? handleFlowSelect : undefined,
  }
}
