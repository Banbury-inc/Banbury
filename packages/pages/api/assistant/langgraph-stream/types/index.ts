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
  generate_video?: boolean
  // System tools
  memory?: boolean
  slack?: boolean
  model_provider?: "anthropic" | "openai" | "google"
  model_id?: string
  image_generation_model?: string
  video_generation_model?: string
  // Skills mode (Anthropic only)
  use_skills?: boolean
  // Plan mode: when enabled, agent uses planner system prompt
  plan_mode?: boolean
  // Ask mode: read-only exploration, only search tools available
  ask_mode?: boolean
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

export interface PlanTodoContext {
  id: string
  description: string
  status: "pending" | "in_progress" | "completed" | "failed"
}

export interface PlanContext {
  planId: string
  planTitle: string
  todos: PlanTodoContext[]
  currentTodoId: string
  isSubAgent?: boolean
}

export interface StreamRequestBody {
  messages: any[]
  threadId?: string
  toolPreferences?: ToolPreferences
  documentContext?: string
  dateTimeContext?: DateTimeContext
  recursionLimit?: number
  webSearchOptions?: WebSearchOptions
  planContext?: PlanContext
}

// Todo types for the LangChain todo middleware
export type TodoStatus = "pending" | "in_progress" | "completed" | "failed"
export type TodoSource = "plan" | "agent"

export interface TodoItem {
  id: string
  description: string
  status: TodoStatus
  source: TodoSource
  createdAt: string
  updatedAt: string
  depends?: string[]
  metadata?: Record<string, unknown>
}

export interface ThreadTodoState {
  threadId: string
  todos: TodoItem[]
  activeTodoId: string | null
  lastUpdated: string
}

// SSE event types for todo updates
export type TodoEventType = 
  | "todo-list-init"
  | "todo-item-add"
  | "todo-item-update"
  | "todo-item-remove"
  | "todo-active-change"

export interface TodoEventBase {
  type: TodoEventType
  threadId: string
}

export interface TodoListInitEvent extends TodoEventBase {
  type: "todo-list-init"
  todos: TodoItem[]
  activeTodoId: string | null
}

export interface TodoItemAddEvent extends TodoEventBase {
  type: "todo-item-add"
  todo: TodoItem
}

export interface TodoItemUpdateEvent extends TodoEventBase {
  type: "todo-item-update"
  todoId: string
  updates: Partial<Pick<TodoItem, "description" | "status" | "depends" | "metadata">>
}

export interface TodoItemRemoveEvent extends TodoEventBase {
  type: "todo-item-remove"
  todoId: string
}

export interface TodoActiveChangeEvent extends TodoEventBase {
  type: "todo-active-change"
  activeTodoId: string | null
}

export type TodoEvent = 
  | TodoListInitEvent
  | TodoItemAddEvent
  | TodoItemUpdateEvent
  | TodoItemRemoveEvent
  | TodoActiveChangeEvent
