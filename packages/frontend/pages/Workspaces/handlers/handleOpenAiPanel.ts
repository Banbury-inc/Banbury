interface HandleOpenAiPanelParams {
  setIsAssistantPanelCollapsed: (collapsed: boolean) => void
  isMobile: boolean
  setMobileAssistantOpen: (open: boolean) => void
}

export function createOpenAiPanelHandler({
  setIsAssistantPanelCollapsed,
  isMobile,
  setMobileAssistantOpen
}: HandleOpenAiPanelParams): () => void {
  return () => {
    setIsAssistantPanelCollapsed(false)
    if (isMobile) {
      setMobileAssistantOpen(true)
    }
  }
}

export const OPEN_AI_PANEL_EVENT = 'open-ai-panel'
