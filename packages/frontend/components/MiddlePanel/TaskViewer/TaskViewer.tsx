import { ArrowLeft, Trash2, CheckCircle2, XCircle, Clock, Play, Pause, Tag as TagIcon, User } from "lucide-react"
import { useState, useCallback } from "react"
import { Button } from "../../ui/button"
import { useToast } from "../../ui/use-toast"
import { Typography } from "../../ui/typography"
import { Badge } from "../../ui/badge"
import { Separator } from "../../ui/separator"
import { Task, TaskStatus } from "../../../pages/TaskStudio/types"
import { taskHandlers } from "../../../pages/TaskStudio/handlers/taskHandlers"

interface TaskViewerProps {
  task: Task
  onBack?: () => void
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
}

export function TaskViewer({ task, onBack, onTaskUpdated, onTaskDeleted }: TaskViewerProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task>(task)

  const formatDate = (date: Date | string) => {
    if (!date) return 'Not scheduled'
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return 'Invalid date'
    return d.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'Not specified'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'running':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      case 'scheduled':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const handleStatusChange = useCallback(async (newStatus: TaskStatus) => {
    setIsUpdating(true)
    try {
      let updatedTask: Task
      
      switch (newStatus) {
        case 'running':
          updatedTask = await taskHandlers.startTask(currentTask.id)
          break
        case 'completed':
          updatedTask = await taskHandlers.completeTask(currentTask.id)
          break
        case 'cancelled':
          updatedTask = await taskHandlers.cancelTask(currentTask.id)
          break
        default:
          updatedTask = await taskHandlers.updateTask({ id: currentTask.id, status: newStatus })
      }
      
      setCurrentTask(updatedTask)
      onTaskUpdated?.(updatedTask)
      toast({
        title: 'Success',
        description: `Task status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error('Failed to update task status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }, [currentTask.id, onTaskUpdated, toast])

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    setIsUpdating(true)
    try {
      await taskHandlers.deleteTask(currentTask.id)
      onTaskDeleted?.(currentTask.id)
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      })
      onBack?.()
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }, [currentTask.id, onTaskDeleted, onBack, toast])

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <Typography variant="h3" className="text-lg font-semibold truncate">
              {currentTask.title}
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={getStatusBadgeVariant(currentTask.status)}>
            {currentTask.status.charAt(0).toUpperCase() + currentTask.status.slice(1)}
          </Badge>
          <Badge variant={getPriorityBadgeVariant(currentTask.priority)}>
            {currentTask.priority.charAt(0).toUpperCase() + currentTask.priority.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-3 bg-card border-b border-border flex items-center gap-2">
        {currentTask.status === 'scheduled' && (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleStatusChange('running')}
            disabled={isUpdating}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Task
          </Button>
        )}
        {currentTask.status === 'running' && (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleStatusChange('completed')}
            disabled={isUpdating}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Task
          </Button>
        )}
        {(currentTask.status === 'scheduled' || currentTask.status === 'running') && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange('cancelled')}
            disabled={isUpdating}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Task
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isUpdating}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Description */}
          <div>
            <Typography variant="h4" className="text-sm font-semibold mb-2">
              Description
            </Typography>
            <Typography variant="p" className="text-sm whitespace-pre-wrap">
              {currentTask.description || 'No description provided'}
            </Typography>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" className="text-muted-foreground mb-1">
                Scheduled Date
              </Typography>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Typography variant="p" className="text-sm">
                  {formatDate(currentTask.scheduledDate)}
                </Typography>
              </div>
            </div>

            <div>
              <Typography variant="small" className="text-muted-foreground mb-1">
                Estimated Duration
              </Typography>
              <Typography variant="p" className="text-sm">
                {formatDuration(currentTask.estimatedDuration)}
              </Typography>
            </div>

            {currentTask.assignedTo && (
              <div>
                <Typography variant="small" className="text-muted-foreground mb-1">
                  Assigned To
                </Typography>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="p" className="text-sm">
                    {currentTask.assignedTo}
                  </Typography>
                </div>
              </div>
            )}

            <div>
              <Typography variant="small" className="text-muted-foreground mb-1">
                Created
              </Typography>
              <Typography variant="p" className="text-sm">
                {formatDate(currentTask.createdAt)}
              </Typography>
            </div>
          </div>

          {/* Tags */}
          {currentTask.tags && currentTask.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <Typography variant="h4" className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {currentTask.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Result */}
          {currentTask.result && (
            <>
              <Separator />
              <div>
                <Typography variant="h4" className="text-sm font-semibold mb-2">
                  Result
                </Typography>
                <Typography variant="p" className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                  {currentTask.result}
                </Typography>
              </div>
            </>
          )}

          {/* Error */}
          {currentTask.error && (
            <>
              <Separator />
              <div>
                <Typography variant="h4" className="text-sm font-semibold mb-2 text-destructive">
                  Error
                </Typography>
                <Typography variant="p" className="text-sm whitespace-pre-wrap bg-destructive/10 text-destructive p-3 rounded">
                  {currentTask.error}
                </Typography>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

