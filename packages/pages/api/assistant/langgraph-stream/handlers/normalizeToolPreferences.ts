import type { ToolPreferences } from "../types"

interface NormalizeToolPreferencesParams {
  toolPreferences?: Partial<ToolPreferences>
}

export function normalizeToolPreferences({ 
  toolPreferences = {} 
}: NormalizeToolPreferencesParams): ToolPreferences {
  // Browser toggle: prefer explicit 'browser'; fall back to legacy 'browserbase'
  const browserEnabled = (typeof (toolPreferences as any).browser === 'boolean')
    ? Boolean((toolPreferences as any).browser)
    : Boolean((toolPreferences as any).browserbase)
  
  return {
    web_search: toolPreferences.web_search !== false,
    tiptap_ai: toolPreferences.tiptap_ai !== false,
    read_file: toolPreferences.read_file !== false,
    gmail: toolPreferences.gmail !== false,
    gmailSend: toolPreferences.gmailSend !== false,
    browser: browserEnabled,
    browserbase: browserEnabled,
    x_api: toolPreferences.x_api === true,
    langgraph_mode: true,
    model_provider: toolPreferences.model_provider === "openai" ? "openai" : "anthropic",
  }
}

