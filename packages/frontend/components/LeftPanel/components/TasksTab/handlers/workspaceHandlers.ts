import { useCallback } from 'react'
import { PanelGroup } from '../../../../../pages/Workspaces/types'
import { Task } from '../../../../../pages/TaskStudio/types'
import { openTaskInTab } from '../../../../../pages/Workspaces/handlers/tabManagement'
import { getAllTabs, updatePanelActiveTab, addTabToPanel } from '../../../../../pages/Workspaces/handlers/panelUtils'

interface WorkspaceDependencies {
  activePanelId: string
  panelLayout: PanelGroup
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>
}

export function useTaskWorkspaceHandlers(deps: WorkspaceDependencies) {
  const {
    activePanelId,
    panelLayout,
    setPanelLayout,
    setActivePanelId,
    setSelectedTask
  } = deps

  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task)
    openTaskInTab(
      task,
      activePanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout
    )
  }, [activePanelId, panelLayout, setActivePanelId, setPanelLayout, setSelectedTask])

  const handleCreateTask = useCallback(() => {
    openTaskInTab(null, activePanelId, activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout)
  }, [activePanelId, panelLayout, setActivePanelId, setPanelLayout])

  return {
    handleTaskSelect,
    handleCreateTask
  }
}
