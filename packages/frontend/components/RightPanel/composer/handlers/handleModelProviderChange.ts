interface HandleModelProviderChangeParams {
  modelProvider: "anthropic" | "openai"
  toolPreferences: {
    web_search: boolean
    tiptap_ai: boolean
    read_file: boolean
    gmail: boolean
    langgraph_mode: boolean
    browser: boolean
    x_api: boolean
    slack: boolean
    model_provider: "anthropic" | "openai"
  }
  onUpdateToolPreferences: (
    prefs: {
      web_search: boolean
      tiptap_ai: boolean
      read_file: boolean
      gmail: boolean
      langgraph_mode: boolean
      browser: boolean
      x_api: boolean
      slack: boolean
      model_provider: "anthropic" | "openai"
    }
  ) => void
}

export function handleModelProviderChange({
  modelProvider,
  toolPreferences,
  onUpdateToolPreferences,
}: HandleModelProviderChangeParams) {
  if (modelProvider !== "anthropic" && modelProvider !== "openai") return

  const updatedPreferences = {
    ...toolPreferences,
    model_provider: modelProvider,
  }

  onUpdateToolPreferences(updatedPreferences)
}


