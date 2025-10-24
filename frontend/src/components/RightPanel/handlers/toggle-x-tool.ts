export interface ToolPreferences {
  web_search: boolean
  tiptap_ai: boolean
  read_file: boolean
  gmail: boolean
  langgraph_mode: boolean
  browser: boolean
  x_api: boolean
  slack: boolean
}

export function toggleXTool({ prefs }: { prefs: ToolPreferences }): ToolPreferences {
  if (!prefs) {
    return {
      web_search: true,
      tiptap_ai: true,
      read_file: true,
      gmail: true,
      langgraph_mode: true,
      browser: false,
      x_api: false,
      slack: false,
    }
  }
  return { ...prefs, x_api: !prefs.x_api }
}


