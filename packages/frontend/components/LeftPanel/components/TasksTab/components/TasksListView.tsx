import { Task, TaskStatus } from '../../../../../pages/TaskStudio/types'
import { Badge } from '../../../../ui/badge'
import { Typography } from '../../../../ui/typography'
import { Clock, CheckCircle2, XCircle, PlayCircle } from 'lucide-react'

interface TasksListViewProps {
  tasks: Task[]
  loading: boolean
  onTaskSelect?: (task: Task) => void
  selectedTask?: Task | null
}

function getStatusBadgeVariant(status: TaskStatus) {
  switch (status) {
    case 'scheduled':
      return 'secondary'
    case 'running':
      return 'default'
    case 'completed':
      return 'outline'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'scheduled':
      return Clock
    case 'running':
      return PlayCircle
    case 'completed':
      return CheckCircle2
    case 'cancelled':
      return XCircle
    default:
      return Clock
  }
}

function formatDate(date: Date) {
  const now = new Date()
  const taskDate = new Date(date)
  const diffMs = taskDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return taskDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Tomorrow'
  } else if (diffDays === -1) {
    return 'Yesterday'
  } else if (diffDays > 0 && diffDays < 7) {
    return taskDate.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

export function TasksListView({ tasks, loading, onTaskSelect, selectedTask }: TasksListViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 p-4">
        <Typography variant="xs" className="text-muted-foreground">Loading tasks...</Typography>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center flex-1 p-4">
        <Typography variant="xs" className="text-muted-foreground">No tasks found</Typography>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-2 space-y-1">
        {tasks.map((task) => {
          const StatusIcon = getStatusIcon(task.status)
          const isSelected = selectedTask?.id === task.id

          return (
            <div
              key={task.id}
              onClick={() => onTaskSelect?.(task)}
              className={`
                p-2 rounded-md cursor-pointer transition-colors min-w-0
                ${isSelected 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'hover:bg-muted'
                }
              `}
            >
              <div className="flex items-start gap-2 min-w-0">
                <StatusIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1 min-w-0">
                    <Typography variant="xs" className="font-medium truncate flex-1 min-w-0">
                      {task.title}
                    </Typography>
                    <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs flex-shrink-0">
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </div>
                  {task.description && (
                    <Typography variant="muted" className="text-xs truncate mb-1 block min-w-0">
                      {task.description}
                    </Typography>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <Typography variant="xs" className="truncate min-w-0">{formatDate(task.scheduledDate)}</Typography>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

