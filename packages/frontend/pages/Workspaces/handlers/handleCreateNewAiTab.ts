interface HandleCreateNewAiTabParams {
  activeAssistantPanelId: string
  handleAssistantTabAdd: (panelId: string, label?: string) => void
  setActiveAssistantPanelId: (panelId: string) => void
}

export function createCreateNewAiTabHandler({
  activeAssistantPanelId,
  handleAssistantTabAdd,
  setActiveAssistantPanelId
}: HandleCreateNewAiTabParams): (event: Event) => void {
  return (event: Event) => {
    const customEvent = event as CustomEvent<{ label?: string }>
    const label = customEvent.detail?.label
    const targetPanelId = activeAssistantPanelId || 'assistant-main-panel'
    handleAssistantTabAdd(targetPanelId, label)
    setActiveAssistantPanelId(targetPanelId)
  }
}

export const CREATE_NEW_AI_TAB_EVENT = 'create-new-ai-tab'
