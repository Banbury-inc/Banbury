import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Checkbox } from '../../../components/ui/checkbox'
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
      <Card className="p-6 w-full h-full flex flex-col rounded-none">
        <div className="flex items-center justify-center flex-1">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 w-full h-full flex flex-col rounded-none bg-background">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Task Studio</h1>
          
          {selectedTasks.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedTasks.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                Delete Selected
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
            All ({tasks.length})
          </Button>
          <Button
            variant={filter === 'scheduled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('scheduled')}
          >
            Scheduled ({tasks.filter(t => t.status === 'scheduled').length})
          </Button>
          <Button
            variant={filter === 'running' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('running')}
          >
            Running ({tasks.filter(t => t.status === 'running').length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed ({tasks.filter(t => t.status === 'completed').length})
          </Button>
          <Button 
            onClick={onToggleTaskScheduler}
            variant={showTaskScheduler ? "outline" : "default"}
            size="sm"
          >
            {showTaskScheduler ? 'Cancel' : 'Create Task'}
          </Button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-muted-foreground">
          No tasks found for the selected filter.
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
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
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Priority</th>
                <th className="text-left p-3 font-medium">Scheduled</th>
                <th className="text-left p-3 font-medium">Duration</th>
                <th className="text-left p-3 font-medium">Result</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={(checked: boolean) => handleSelectTask(task.id, checked)}
                    />
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {task.description.length > 50 
                            ? `${task.description.substring(0, 50)}...` 
                            : task.description
                          }
                        </div>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {task.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={getPriorityBadgeVariant(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm">
                    {formatDate(task.scheduledDate)}
                  </td>
                  <td className="p-3 text-sm">
                    {formatDuration(task.estimatedDuration)}
                  </td>
                  <td className="p-3 text-sm max-w-[280px]">
                    {task.error ? (
                      <div className="text-red-500 truncate" title={task.error}>{task.error}</div>
                    ) : task.result ? (
                      <div className="truncate" title={task.result}>{task.result}</div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
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
