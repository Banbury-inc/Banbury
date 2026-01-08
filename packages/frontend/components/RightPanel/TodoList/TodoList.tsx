import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Trash2,
} from 'lucide-react'
import { cn } from '../../../utils'
import { Typography } from '../../ui/typography'
import { Button } from '../../ui/button'
import type { TodoItem, ThreadTodoState, TodoStatus } from '../../../types/todo-types'
import {
  getThreadTodoState,
  clearCompletedTodos,
} from '../handlers/todoStoreHandlers'

interface TodoListProps {
  threadId: string
}

// Status icon component
function StatusIcon({ status }: { status: TodoStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
    case 'in_progress':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" strokeWidth={1.5} />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" strokeWidth={1.5} />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
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
        'flex items-start gap-2 px-2 py-1.5 rounded-md transition-colors',
        isActive && 'bg-blue-500/10 border border-blue-500/20',
        todo.status === 'completed' && 'opacity-60',
        todo.status === 'failed' && 'bg-red-500/5'
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        <StatusIcon status={todo.status} />
      </div>
      <div className="flex-1 min-w-0">
        <Typography
          variant="small"
          className={cn(
            'text-xs leading-tight',
            todo.status === 'completed' && 'line-through text-muted-foreground'
          )}
        >
          {todo.description}
        </Typography>
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

  // Load initial state and subscribe to state change events
  useEffect(() => {
    // Load initial state
    const initialState = getThreadTodoState(threadId)
    setTodoState(initialState)

    // Subscribe to state changes (event subscription is handled at RightPanel level)
    const handleStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ threadId: string; state: ThreadTodoState }>
      if (customEvent.detail?.threadId === threadId) {
        setTodoState(customEvent.detail.state)
      }
    }

    window.addEventListener('todo-state-changed', handleStateChange)

    return () => {
      window.removeEventListener('todo-state-changed', handleStateChange)
    }
  }, [threadId])

  // Refresh state when threadId changes
  useEffect(() => {
    setTodoState(getThreadTodoState(threadId))
  }, [threadId])

  const handleClearCompleted = useCallback(() => {
    const newState = clearCompletedTodos(threadId)
    setTodoState(newState)
  }, [threadId])

  // Don't render if no todos
  if (!todoState || todoState.todos.length === 0) {
    return null
  }

  const completedCount = todoState.todos.filter(t => t.status === 'completed').length
  const totalCount = todoState.todos.length
  const hasCompleted = completedCount > 0

  // Group todos by source
  const planTodos = todoState.todos.filter(t => t.source === 'plan')
  const agentTodos = todoState.todos.filter(t => t.source === 'agent')

  return (
    <div className="border-b border-border bg-background/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          )}
          <ListTodo className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <Typography variant="small" className="text-xs font-medium">
            Todos
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Typography variant="small" className="text-[10px] text-muted-foreground">
            {completedCount}/{totalCount}
          </Typography>
          {/* Progress bar */}
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </button>

      {/* Todo list */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-1">
          {/* Plan todos */}
          {planTodos.length > 0 && (
            <div className="space-y-0.5">
              {agentTodos.length > 0 && (
                <Typography variant="small" className="text-[10px] text-muted-foreground px-2 pt-1">
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
            <div className="space-y-0.5">
              {planTodos.length > 0 && (
                <Typography variant="small" className="text-[10px] text-muted-foreground px-2 pt-2">
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

          {/* Clear completed button */}
          {hasCompleted && (
            <div className="pt-1 px-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCompleted}
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground w-full justify-start"
              >
                <Trash2 className="h-3 w-3 mr-1" strokeWidth={1.5} />
                Clear completed
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
