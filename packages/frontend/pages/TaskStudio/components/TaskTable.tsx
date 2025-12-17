import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Checkbox } from '../../../components/ui/checkbox'
import { Typography } from '../../../components/ui/typography'
import { Task, TaskStatus } from '../types'
import { taskHandlers } from '../handlers/taskHandlers'

interface TaskTableProps {
  refreshTrigger: number
  showTaskScheduler: boolean
  onToggleTaskScheduler: () => void
}

export function TaskTable({ refreshTrigger, showTaskScheduler, onToggleTaskScheduler }: TaskTableProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  const loadTasks = async () => {
    setLoading(true)
    try {
      const allTasks = await taskHandlers.getTasks()
      setTasks(allTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [refreshTrigger])

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskHandlers.updateTask({ id: taskId, status: newStatus })
      loadTasks() // Refresh the list
    } catch (error) {
      console.error('Failed to update task status:', error)
      alert('Failed to update task status. Please try again.')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      await taskHandlers.deleteTask(taskId)
      loadTasks() // Refresh the list
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Failed to delete task. Please try again.')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedTasks.size === 0) return
    
    const taskCount = selectedTasks.size
    if (!confirm(`Are you sure you want to delete ${taskCount} task${taskCount > 1 ? 's' : ''}?`)) {
      return
    }

    try {
      await taskHandlers.batchDeleteTasks(Array.from(selectedTasks))
      setSelectedTasks(new Set()) // Clear selection
      loadTasks() // Refresh the list
    } catch (error) {
      console.error('Failed to delete tasks:', error)
      alert('Failed to delete tasks. Please try again.')
    }
  }

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(taskId)
      } else {
        newSet.delete(taskId)
      }
      return newSet
    })
  }

  const getStatusBadgeVariant = (status: TaskStatus) => {
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
        return 'secondary'
    }
  }

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(task => task.status === filter)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)))
    } else {
      setSelectedTasks(new Set())
    }
  }

  const isAllSelected = filteredTasks.length > 0 && filteredTasks.every(task => selectedTasks.has(task.id))
  const isIndeterminate = selectedTasks.size > 0 && selectedTasks.size < filteredTasks.length

  // Clear selections when filter changes
  useEffect(() => {
    setSelectedTasks(new Set())
  }, [filter])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (loading) {
    return (
      <Card className="p-6 w-full h-full flex flex-col rounded-none bg-card">
        <div className="flex items-center justify-center flex-1">
          <Typography variant="p" className="text-muted-foreground">Loading tasks...</Typography>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 w-full h-full flex flex-col rounded-none bg-card">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Typography variant="h2" className="text-lg font-bold text-foreground">Task Studio</Typography>
          
          {selectedTasks.size > 0 && (
            <div className="flex items-center gap-2">
              <Typography variant="xs" className="font-medium text-muted-foreground">{selectedTasks.size} selected</Typography>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                <Typography variant="xs" className="font-medium">Delete Selected</Typography>
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            <Typography variant="xs" className="font-medium">All ({tasks.length})</Typography>
          </Button>
          <Button
            variant={filter === 'scheduled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('scheduled')}
          >
            <Typography variant="xs" className="font-medium">Scheduled ({tasks.filter(t => t.status === 'scheduled').length})</Typography>
          </Button>
          <Button
            variant={filter === 'running' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('running')}
          >
            <Typography variant="xs" className="font-medium">Running ({tasks.filter(t => t.status === 'running').length})</Typography>
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            <Typography variant="xs" className="font-medium">Completed ({tasks.filter(t => t.status === 'completed').length})</Typography>
          </Button>
          <Button 
            onClick={onToggleTaskScheduler}
            variant={showTaskScheduler ? "outline" : "default"}
            size="sm"
          >
            <Typography variant="xs" className="font-medium">{showTaskScheduler ? 'Cancel' : 'Create Task'}</Typography>
          </Button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <Typography variant="xs" className="font-medium text-muted-foreground">No tasks found for the selected filter.</Typography>
        </div>
      ) : (
        <div className="flex-1 overflow-auto min-w-0">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el: HTMLInputElement | null) => {
                      if (el) el.indeterminate = isIndeterminate
                    }}
                  />
                </th>
                <th className="text-left p-3 font-medium w-[20%]">
                  <Typography variant="xs" className="font-medium">Title</Typography>
                </th>
                <th className="text-left p-3 font-medium w-[10%]">
                  <Typography variant="xs" className="font-medium">Status</Typography>
                </th>
                <th className="text-left p-3 font-medium w-[10%]">
                  <Typography variant="xs" className="font-medium">Priority</Typography>
                </th>
                <th className="text-left p-3 font-medium w-[15%]">
                  <Typography variant="xs" className="font-medium">Scheduled</Typography>
                </th>
                <th className="text-left p-3 font-medium w-[10%]">
                  <Typography variant="xs" className="font-medium">Duration</Typography>
                </th>
                <th className="text-left p-3 font-medium w-[15%]">
                  <Typography variant="xs" className="font-medium">Result</Typography>
                </th>
                <th className="text-left p-3 font-medium w-[20%]">
                  <Typography variant="xs" className="font-medium">Actions</Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="border-b hover:bg-muted-foreground/10">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={(checked: boolean) => handleSelectTask(task.id, checked)}
                    />
                  </td>
                  <td className="p-3 min-w-0 overflow-hidden">
                    <div className="min-w-0">
                      <Typography variant="xs" className="truncate">{task.title}</Typography>
                      {task.description && (
                        <Typography variant="muted" className="mt-1 truncate">
                          {task.description.length > 50 
                            ? `${task.description.substring(0, 50)}...` 
                            : task.description
                          }
                        </Typography>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {task.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Typography variant="xs" className="font-medium">{tag}</Typography>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 min-w-0 overflow-hidden">
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-3 min-w-0 overflow-hidden">
                    <Badge variant={getPriorityBadgeVariant(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-3 min-w-0 overflow-hidden">
                    <Typography variant="small" className="text-sm truncate" title={formatDate(task.scheduledDate)}>
                      {formatDate(task.scheduledDate)}
                    </Typography>
                  </td>
                  <td className="p-3 min-w-0 overflow-hidden">
                    <Typography variant="small" className="text-sm truncate">
                      {formatDuration(task.estimatedDuration)}
                    </Typography>
                  </td>
                  <td className="p-3 min-w-0 overflow-hidden">
                    {task.error ? (
                      <Typography variant="small" className="text-red-500 truncate block" title={task.error}>{task.error}</Typography>
                    ) : task.result ? (
                      <Typography variant="small" className="truncate text-sm block" title={task.result}>{task.result}</Typography>
                    ) : (
                      <Typography variant="small" className="text-gray-400">-</Typography>
                    )}
                  </td>
                  <td className="p-3 min-w-0 overflow-hidden">
                    <div className="flex gap-2 flex-wrap">
                      {task.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, 'running')}
                        >
                          Start
                        </Button>
                      )}
                      {task.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      {(task.status === 'scheduled' || task.status === 'running') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
