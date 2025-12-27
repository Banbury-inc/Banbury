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
    x_api: toolPreferences.x_api !== false,
    slack: toolPreferences.slack !== false,
    // Document editing tools
    sheet_ai: toolPreferences.sheet_ai !== false,
    docx_ai: toolPreferences.docx_ai !== false,
    pptx_ai: toolPreferences.pptx_ai !== false,
    tldraw_ai: toolPreferences.tldraw_ai !== false,
    document_ai: toolPreferences.document_ai !== false,
    // File management tools
    create_file: toolPreferences.create_file !== false,
    create_folder: toolPreferences.create_folder !== false,
    download_from_url: toolPreferences.download_from_url !== false,
    search_files: toolPreferences.search_files !== false,
    // Calendar tools
    calendar: toolPreferences.calendar !== false,
    msCalendar: toolPreferences.msCalendar !== false,
    // Development tools
    github: toolPreferences.github !== false,
    // Media tools
    generate_image: toolPreferences.generate_image !== false,
    // System tools
    memory: toolPreferences.memory !== false,
    langgraph_mode: true,
    model_provider: toolPreferences.model_provider === "openai" ? "openai" : "anthropic",
    model_id: toolPreferences.model_id,
  }
}

