import { FlowItem, PanelGroup, WorkspaceTab } from '../../../../../pages/Workspaces/types'

function updateTabs(tabs: WorkspaceTab[], updatedFlow: FlowItem) {
  return tabs.map((tab) => {
    if (tab.type !== 'flow' || tab.flowId !== updatedFlow.id) return tab
    return {
      ...tab,
      title: updatedFlow.name,
      flow: updatedFlow,
    }
  })
}

export function handleSyncFlowTabs(layout: PanelGroup, updatedFlow: FlowItem): PanelGroup {
  if (layout.type === 'panel' && layout.panel)
    return {
      ...layout,
      panel: {
        ...layout.panel,
        tabs: updateTabs(layout.panel.tabs, updatedFlow),
      },
    }

  if (layout.type === 'group' && layout.children)
    return {
      ...layout,
      children: layout.children.map(child => handleSyncFlowTabs(child, updatedFlow)),
    }

  return layout
}
