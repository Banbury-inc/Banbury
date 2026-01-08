// Handler functions for managing per-thread todo state
import type {
  TodoItem,
  TodoEvent,
  ThreadTodoState,
  TodoStatus,
  TodoSource,
} from '../../../types/todo-types'
import { createEmptyThreadTodoState, createTodoItem } from '../../../types/todo-types'

// In-memory store for thread todo states (will be hydrated from localStorage on load)
const todoStoreMap = new Map<string, ThreadTodoState>()

// LocalStorage key prefix
const STORAGE_KEY_PREFIX = 'banbury-thread-todos-'

// Get the storage key for a thread
function getStorageKey(threadId: string): string {
  return `${STORAGE_KEY_PREFIX}${threadId}`
}

// Load thread state from localStorage
function loadFromStorage(threadId: string): ThreadTodoState | null {
  try {
    const stored = localStorage.getItem(getStorageKey(threadId))
    if (stored) {
      return JSON.parse(stored) as ThreadTodoState
    }
  } catch {
    // Ignore localStorage errors
  }
  return null
}

// Save thread state to localStorage
function saveToStorage(state: ThreadTodoState): void {
  try {
    localStorage.setItem(getStorageKey(state.threadId), JSON.stringify(state))
  } catch {
    // Ignore localStorage errors
  }
}

// Get or create thread todo state
export function getThreadTodoState(threadId: string): ThreadTodoState {
  // Check in-memory store first
  let state = todoStoreMap.get(threadId)
  if (state) return state

  // Try to load from storage
  state = loadFromStorage(threadId)
  if (state) {
    todoStoreMap.set(threadId, state)
    return state
  }

  // Create new state
  state = createEmptyThreadTodoState(threadId)
  todoStoreMap.set(threadId, state)
  return state
}

// Update thread todo state and persist
function updateThreadTodoState(threadId: string, updater: (state: ThreadTodoState) => ThreadTodoState): ThreadTodoState {
  const currentState = getThreadTodoState(threadId)
  const newState = updater(currentState)
  newState.lastUpdated = new Date().toISOString()
  todoStoreMap.set(threadId, newState)
  saveToStorage(newState)
  return newState
}

// Process a todo event and return the updated state
export function processTodoEvent(event: TodoEvent): ThreadTodoState {
  const { threadId } = event

  switch (event.type) {
    case 'todo-list-init':
      return updateThreadTodoState(threadId, () => ({
        threadId,
        todos: event.todos,
        activeTodoId: event.activeTodoId,
        lastUpdated: new Date().toISOString(),
      }))

    case 'todo-item-add':
      return updateThreadTodoState(threadId, (state) => ({
        ...state,
        todos: [...state.todos, event.todo],
      }))

    case 'todo-item-update':
      return updateThreadTodoState(threadId, (state) => ({
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === event.todoId
            ? { ...todo, ...event.updates, updatedAt: new Date().toISOString() }
            : todo
        ),
      }))

    case 'todo-item-remove':
      return updateThreadTodoState(threadId, (state) => ({
        ...state,
        todos: state.todos.filter((todo) => todo.id !== event.todoId),
        // Clear active if removed
        activeTodoId: state.activeTodoId === event.todoId ? null : state.activeTodoId,
      }))

    case 'todo-active-change':
      return updateThreadTodoState(threadId, (state) => ({
        ...state,
        activeTodoId: event.activeTodoId,
      }))

    default:
      return getThreadTodoState(threadId)
  }
}

// Add a todo item from plan context (used when plan execution starts)
export function addPlanTodo(
  threadId: string,
  planTodo: { id: string; description: string; status: TodoStatus; depends?: string[] }
): ThreadTodoState {
  const todo = createTodoItem({
    id: planTodo.id,
    description: planTodo.description,
    status: planTodo.status,
    source: 'plan',
    depends: planTodo.depends,
  })

  return updateThreadTodoState(threadId, (state) => {
    // Don't add duplicates
    if (state.todos.some((t) => t.id === todo.id)) {
      return state
    }
    return {
      ...state,
      todos: [...state.todos, todo],
    }
  })
}

// Update a todo's status
export function updateTodoStatus(
  threadId: string,
  todoId: string,
  status: TodoStatus
): ThreadTodoState {
  return updateThreadTodoState(threadId, (state) => ({
    ...state,
    todos: state.todos.map((todo) =>
      todo.id === todoId
        ? { ...todo, status, updatedAt: new Date().toISOString() }
        : todo
    ),
  }))
}

// Set the active todo
export function setActiveTodo(threadId: string, todoId: string | null): ThreadTodoState {
  return updateThreadTodoState(threadId, (state) => ({
    ...state,
    activeTodoId: todoId,
  }))
}

// Clear all todos for a thread
export function clearThreadTodos(threadId: string): ThreadTodoState {
  const state = createEmptyThreadTodoState(threadId)
  todoStoreMap.set(threadId, state)
  saveToStorage(state)
  return state
}

// Clear completed todos
export function clearCompletedTodos(threadId: string): ThreadTodoState {
  return updateThreadTodoState(threadId, (state) => ({
    ...state,
    todos: state.todos.filter((todo) => todo.status !== 'completed'),
  }))
}

// Initialize plan todos from plan context
export function initializePlanTodos(
  threadId: string,
  planTodos: Array<{ id: string; description: string; status: TodoStatus; depends?: string[] }>
): ThreadTodoState {
  const todos: TodoItem[] = planTodos.map((pt) =>
    createTodoItem({
      id: pt.id,
      description: pt.description,
      status: pt.status,
      source: 'plan',
      depends: pt.depends,
    })
  )

  return updateThreadTodoState(threadId, (state) => {
    // Merge with existing agent todos, replacing any plan todos
    const agentTodos = state.todos.filter((t) => t.source === 'agent')
    return {
      ...state,
      todos: [...todos, ...agentTodos],
    }
  })
}

// Subscribe to todo events (call this once on app init)
export function subscribeTodoEventListener(): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<TodoEvent>
    if (customEvent.detail) {
      const newState = processTodoEvent(customEvent.detail)
      // Dispatch state change event for UI components to react
      window.dispatchEvent(
        new CustomEvent('todo-state-changed', {
          detail: { threadId: newState.threadId, state: newState },
        })
      )
    }
  }

  window.addEventListener('assistant-todo-event', handler)
  return () => {
    window.removeEventListener('assistant-todo-event', handler)
  }
}