// Shared todo types for the LangChain todo middleware + UI

export type TodoStatus = "pending" | "in_progress" | "completed" | "failed"

export type TodoSource = "plan" | "agent"

export interface TodoItem {
  id: string
  description: string
  status: TodoStatus
  source: TodoSource
  createdAt: string
  updatedAt: string
  depends?: string[] // IDs of todos this one depends on
  metadata?: Record<string, unknown> // Optional extra data
}

export interface ThreadTodoState {
  threadId: string
  todos: TodoItem[]
  activeTodoId: string | null // Currently executing todo
  lastUpdated: string
}

// SSE event types for todo updates
export type TodoEventType = 
  | "todo-list-init"      // Initialize/replace the full list
  | "todo-item-add"       // Add a new todo
  | "todo-item-update"    // Update an existing todo
  | "todo-item-remove"    // Remove a todo
  | "todo-active-change"  // Change which todo is active

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

// Helper to create a new todo item
export function createTodoItem(params: {
  id?: string
  description: string
  source: TodoSource
  status?: TodoStatus
  depends?: string[]
  metadata?: Record<string, unknown>
}): TodoItem {
  const now = new Date().toISOString()
  return {
    id: params.id || `todo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    description: params.description,
    status: params.status || "pending",
    source: params.source,
    createdAt: now,
    updatedAt: now,
    depends: params.depends,
    metadata: params.metadata,
  }
}

// Helper to create an empty thread todo state
export function createEmptyThreadTodoState(threadId: string): ThreadTodoState {
  return {
    threadId,
    todos: [],
    activeTodoId: null,
    lastUpdated: new Date().toISOString(),
  }
}
