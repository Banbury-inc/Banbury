export interface AssistantUiMessagePart {
  type: "text" | "tool-call" | "file-attachment"
  text?: string
  toolCallId?: string
  toolName?: string
  args?: any
  argsText?: string
  result?: any
  fileId?: string
  fileName?: string
  filePath?: string
  fileData?: string
  mimeType?: string
}

export interface AssistantUiMessage {
  role: "system" | "user" | "assistant"
  content: AssistantUiMessagePart[]
}

export interface ToolPreferences {
  web_search?: boolean
  read_file?: boolean
  gmail?: boolean
  gmailSend?: boolean
  browser?: boolean
  browserbase?: boolean
  langgraph_mode?: boolean
  x_api?: boolean
  tiptap_ai?: boolean
  // Document editing tools
  sheet_ai?: boolean
  docx_ai?: boolean
  pptx_ai?: boolean
  tldraw_ai?: boolean
  document_ai?: boolean
  // File management tools
  create_file?: boolean
  create_folder?: boolean
  download_from_url?: boolean
  search_files?: boolean
  // Calendar tools
  calendar?: boolean
  msCalendar?: boolean
  // Development tools
  github?: boolean
  // Media tools
  generate_image?: boolean
  // System tools
  memory?: boolean
  slack?: boolean
  model_provider?: "anthropic" | "openai"
  model_id?: string
  image_generation_model?: string
}

export interface DateTimeContext {
  currentDate: string
  currentTime: string
  timezone: string
  isoString: string
  formatted: string
}

export interface WebSearchOptions {
  searchDepth?: "basic" | "advanced"
  maxResults?: number
  includeAnswer?: boolean
  includeRawContent?: boolean
  includeImages?: boolean
  includeImageDescriptions?: boolean
  topic?: string
  timeRange?: "day" | "week" | "month" | "year"
  includeDomains?: string[]
  excludeDomains?: string[]
}

export interface StreamRequestBody {
  messages: any[]
  threadId?: string
  toolPreferences?: ToolPreferences
  documentContext?: string
  dateTimeContext?: DateTimeContext
  recursionLimit?: number
  webSearchOptions?: WebSearchOptions
}

