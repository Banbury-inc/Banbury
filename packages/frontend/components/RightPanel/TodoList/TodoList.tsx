import { useState, useEffect, useRef } from 'react'
import type { SVGProps } from 'react'
import {
  Check,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ListTodo,
} from 'lucide-react'
import { cn } from '../../../utils'
import { Typography } from '../../common/ui/typography'
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

// Status icon component - matches PlanViewer styling
function StatusIcon({ status, isActive }: { status: TodoStatus; isActive?: boolean }) {
  // Active todos show spinning loader regardless of pending status
  if (isActive && status === 'in_progress') {
    return <Loader2 className="h-3 w-3 animate-spin" />
  }
  
  switch (status) {
    case 'completed':
      return <Check className="h-3 w-3 text-green-600" />
    case 'in_progress':
      return <Loader2 className="h-3 w-3 animate-spin" />
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />
  }
}

// Individual todo item component - styled like PlanViewer todo rows
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
        'flex flex-nowrap items-center gap-3 rounded px-3 py-2 transition-colors',
        isActive && 'bg-accent/50',
        todo.status === 'failed' && 'bg-destructive/5'
      )}
    >
      {/* Status icon */}
      <div className="shrink-0">
        <StatusIcon status={todo.status} isActive={isActive} />
      </div>
      
      {/* Description */}
      <div className="flex-1 min-w-0">
        <Typography 
          variant="small" 
          className={cn(
            "truncate block",
            todo.status === 'completed' && 'line-through text-muted-foreground'
          )}
        >
          {todo.description}
        </Typography>
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
  const completedCount = todoState.todos.filter(t => t.status === 'completed').length

  // Group todos by source
  const planTodos = todoState.todos.filter(t => t.source === 'plan')
  const agentTodos = todoState.todos.filter(t => t.source === 'agent')

  return (
    <div className="shrink-0 border-b border-border">
      {/* Header - styled like PlanViewer todos header */}
      <div className="flex w-full items-center gap-2 px-4 py-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center gap-2 hover:bg-muted/50 transition-colors rounded px-2 py-1 -mx-2"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <Typography variant="small" className="font-medium">
            Todos ({completedCount}/{totalCount})
          </Typography>
        </button>
      </div>

      {/* Expanded todo list - styled like PlanViewer */}
      {isExpanded && (
        <div className="max-h-[250px] overflow-y-auto px-4 pb-3">
          <div className="space-y-1">
            {/* Plan todos */}
            {planTodos.length > 0 && (
              <div>
                {agentTodos.length > 0 && (
                  <Typography variant="xs" className="text-muted-foreground px-3 pt-2 pb-1 block">
                    Plan Tasks
                  </Typography>
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
                  <Typography variant="xs" className="text-muted-foreground px-3 pt-2 pb-1 block">
                    Agent Tasks
                  </Typography>
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
        </div>
      )}
    </div>
  )
}
