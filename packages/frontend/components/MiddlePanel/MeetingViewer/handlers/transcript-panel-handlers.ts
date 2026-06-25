import type { RefObject } from "react"
import type { ImperativePanelHandle } from "react-resizable-panels"

export function toggleTranscriptPanel(
  panelRef: RefObject<ImperativePanelHandle | null>
): void {
  const panel = panelRef.current
  if (!panel) return

  if (panel.isCollapsed()) panel.expand()
  else panel.collapse()
}
