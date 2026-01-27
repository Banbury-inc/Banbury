import type { Panel, PanelGroup } from '@/pages/Workspaces/types'
import { isDefaultAiTabLabel, deriveAiTabTitleFromText } from '@/components/RightPanel/handlers/aiTabTitle'

type SetLayout = React.Dispatch<React.SetStateAction<PanelGroup>>

export function createTitleCandidateHandler(
  setAssistantDockLayout: SetLayout
): (event: Event) => void {
  return (event: Event) => {
    const { tabId, text } = (event as CustomEvent).detail || {}
    if (!tabId || !text) return

    const derivedTitle = deriveAiTabTitleFromText(text)
    if (!derivedTitle) return

    setAssistantDockLayout((prev) => {
      const updatePanel = (panel: Panel): Panel => ({
        ...panel,
        tabs: panel.tabs.map((tab) => {
          if (tab.type === 'ai' && tab.id === tabId && isDefaultAiTabLabel(tab.label)) {
            return { ...tab, label: derivedTitle }
          }
          return tab
        })
      })

      const updateGroup = (group: PanelGroup): PanelGroup => {
        if (group.type === 'panel' && group.panel) {
          return { ...group, panel: updatePanel(group.panel) }
        }
        if (group.type === 'group' && group.children) {
          return { ...group, children: group.children.map(updateGroup) }
        }
        return group
      }

      return updateGroup(prev)
    })
  }
}
