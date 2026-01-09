import { useState, useEffect, useRef } from 'react'
import type { SVGProps } from 'react'
import {
  Check,
  Circle,
  XCircle,
  ChevronDown,
  ChevronRight,
  ListTodo,
} from 'lucide-react'
import { cn } from '../../../utils'
import type { TodoItem, ThreadTodoState, TodoStatus } from '../../../types/todo-types'
import {
  getThreadTodoState,
} from '../handlers/todoStoreHandlers'

const Loader2 = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
)

interface TodoListProps {
  threadId: string
}

// Status icon component
function StatusIcon({ status }: { status: TodoStatus }) {
  switch (status) {
    case 'completed':
      return <Check className="h-3 w-3 text-green-600" />
    case 'in_progress':
      return <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
    case 'failed':
      return <XCircle className="h-3 w-3 text-red-500" />
    default:
      return <Circle className="h-3 w-3 text-muted-foreground" />
  }
}

// Individual todo item component
function TodoItemRow({
  todo,
  isActive,
}: {
  todo: TodoItem
  isActive: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-1 py-1 rounded-md transition-colors',
        todo.status === 'completed' && 'opacity-60',
        todo.status === 'failed' && 'bg-red-500/5'
      )}
    >
      <div className="flex-shrink-0">
        <StatusIcon status={todo.status} />
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-xs font-medium text-foreground/90',
          todo.status === 'completed' && 'line-through text-muted-foreground'
        )}>
          {todo.description}
        </span>
        {todo.source === 'agent' && (
          <span className="text-[10px] text-muted-foreground ml-1">(agent)</span>
        )}
      </div>
    </div>
  )
}

export function TodoList({ threadId }: TodoListProps) {
  const [todoState, setTodoState] = useState<ThreadTodoState | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const previousTodoCountRef = useRef<number>(0)

  // Load initial state and subscribe to state change events
  useEffect(() => {
    // Load initial state
    const initialState = getThreadTodoState(threadId)
    setTodoState(initialState)
    previousTodoCountRef.current = initialState?.todos.length || 0
    // Auto-expand if there are todos initially (e.g., from plan execution)
    if (initialState && initialState.todos.length > 0) {
      setIsExpanded(true)
    }

    // Subscribe to state changes (event subscription is handled at RightPanel level)
    const handleStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ threadId: string; state: ThreadTodoState }>
      if (customEvent.detail?.threadId === threadId) {
        const previousTodoCount = previousTodoCountRef.current
        const newState = customEvent.detail.state
        setTodoState(newState)
        previousTodoCountRef.current = newState.todos.length
        // Auto-expand when todos are initialized (going from 0 to having todos)
        if (previousTodoCount === 0 && newState.todos.length > 0) {
          setIsExpanded(true)
        }
      }
    }

    window.addEventListener('todo-state-changed', handleStateChange)

    return () => {
      window.removeEventListener('todo-state-changed', handleStateChange)
    }
  }, [threadId])

  // Refresh state when threadId changes
  useEffect(() => {
    const newState = getThreadTodoState(threadId)
    setTodoState(newState)
    previousTodoCountRef.current = newState?.todos.length || 0
    // Auto-expand if there are todos when switching threads
    if (newState && newState.todos.length > 0) {
      setIsExpanded(true)
    }
  }, [threadId])

  // Don't render if no todos
  if (!todoState || todoState.todos.length === 0) {
    return null
  }

  const totalCount = todoState.todos.length

  // Group todos by source
  const planTodos = todoState.todos.filter(t => t.source === 'plan')
  const agentTodos = todoState.todos.filter(t => t.source === 'agent')

  return (
    <div className="border-b border-border bg-background/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center px-1 py-1 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          )}
          <ListTodo className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-xs font-medium text-foreground/90">Todos</span>
          <span className="text-xs text-muted-foreground">{totalCount}</span>
        </div>
      </button>

      {/* Todo list */}
      {isExpanded && (
        <div className="px-1 pb-1">
          {/* Plan todos */}
          {planTodos.length > 0 && (
            <div>
              {agentTodos.length > 0 && (
                <span className="text-xs text-muted-foreground px-1 pt-1 block">
                  Plan Tasks
                </span>
              )}
              {planTodos.map(todo => (
                <TodoItemRow
                  key={todo.id}
                  todo={todo}
                  isActive={todoState.activeTodoId === todo.id}
                />
              ))}
            </div>
          )}

          {/* Agent todos */}
          {agentTodos.length > 0 && (
            <div>
              {planTodos.length > 0 && (
                <span className="text-xs text-muted-foreground px-1 pt-1 block">
                  Agent Tasks
                </span>
              )}
              {agentTodos.map(todo => (
                <TodoItemRow
                  key={todo.id}
                  todo={todo}
                  isActive={todoState.activeTodoId === todo.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
