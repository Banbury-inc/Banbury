interface StoredPanelState {
  isFileSidebarCollapsed: boolean
  isAssistantPanelCollapsed: boolean
}

const PANEL_STATE_STORAGE_KEY = 'workspacePanelState'

const defaultPanelState: StoredPanelState = {
  isFileSidebarCollapsed: false,
  isAssistantPanelCollapsed: false,
}

function readStoredPanelState(): Partial<StoredPanelState> {
  if (typeof window === 'undefined') return {}

  try {
    const rawState = window.localStorage.getItem(PANEL_STATE_STORAGE_KEY)
    if (!rawState) return {}

    const parsedState = JSON.parse(rawState) as Partial<StoredPanelState>
    return {
      isFileSidebarCollapsed:
        typeof parsedState.isFileSidebarCollapsed === 'boolean'
          ? parsedState.isFileSidebarCollapsed
          : undefined,
      isAssistantPanelCollapsed:
        typeof parsedState.isAssistantPanelCollapsed === 'boolean'
          ? parsedState.isAssistantPanelCollapsed
          : undefined,
    }
  } catch {
    return {}
  }
}

export function getStoredPanelState(): StoredPanelState {
  return {
    ...defaultPanelState,
    ...readStoredPanelState(),
  }
}

export function saveStoredPanelState(panelState: Partial<StoredPanelState>): void {
  if (typeof window === 'undefined') return

  const nextPanelState = {
    ...getStoredPanelState(),
    ...panelState,
  }

  window.localStorage.setItem(PANEL_STATE_STORAGE_KEY, JSON.stringify(nextPanelState))
}
