// Bridge between PlanViewer and the shared todo store
import type {
  TodoItem,
  TodoStatus,
  TodoListInitEvent,
  TodoItemUpdateEvent,
  TodoActiveChangeEvent,
} from '../../../../types/todo-types'
import type { PlanTodo } from '../PlanViewer'

/**
 * Dispatch a todo-list-init event to initialize the todo store with plan todos
 */
export function dispatchPlanTodosInit(
  threadId: string,
  planTodos: PlanTodo[],
  activeTodoId: string | null = null
): void {
  const todos: TodoItem[] = planTodos.map(pt => ({
    id: pt.id,
    description: pt.description,
    status: pt.status,
    source: 'plan' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    depends: pt.depends,
  }))

  const event: TodoListInitEvent = {
    type: 'todo-list-init',
    threadId,
    todos,
    activeTodoId,
  }

  window.dispatchEvent(new CustomEvent('assistant-todo-event', { detail: event }))
}

/**
 * Dispatch a todo-item-update event when a plan todo status changes
 */
export function dispatchPlanTodoUpdate(
  threadId: string,
  todoId: string,
  status: TodoStatus
): void {
  const event: TodoItemUpdateEvent = {
    type: 'todo-item-update',
    threadId,
    todoId,
    updates: { status },
  }

  window.dispatchEvent(new CustomEvent('assistant-todo-event', { detail: event }))
}

/**
 * Dispatch a todo-active-change event when the active todo changes
 */
export function dispatchActiveTodoChange(
  threadId: string,
  activeTodoId: string | null
): void {
  const event: TodoActiveChangeEvent = {
    type: 'todo-active-change',
    threadId,
    activeTodoId,
  }

  window.dispatchEvent(new CustomEvent('assistant-todo-event', { detail: event }))
}

/**
 * Get the active AI tab's threadId from window global
 * Falls back to looking up the active tab directly from the aiTabs state stored on window
 */
export function getActiveThreadId(): string | null {
  const activeTabId = (window as any).__banburyActiveAiTabId
  if (!activeTabId) {
    return null
  }
  
  // First try the thread map
  const threadMap = (window as any).__banburyTabThreadMap || {}
  let threadId = threadMap[activeTabId]
  
  // Fallback: look up directly from aiTabs if available
  if (!threadId) {
    const aiTabs = (window as any).__banburyAiTabs
    if (aiTabs && Array.isArray(aiTabs)) {
      const activeTab = aiTabs.find((t: any) => t.id === activeTabId)
      if (activeTab?.threadId) {
        threadId = activeTab.threadId
        // Also register it for future lookups
        registerTabThreadId(activeTabId, threadId)
      }
    }
  }
  
  return threadId || null
}

/**
 * Register a tab's threadId for lookup
 */
export function registerTabThreadId(tabId: string, threadId: string): void {
  const threadMap = (window as any).__banburyTabThreadMap || {}
  threadMap[tabId] = threadId
  ;(window as any).__banburyTabThreadMap = threadMap
}
