import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/old-input'
import { Label } from '../../ui/label'
import { Typography } from '../../ui/typography'
import { CreateTaskData, TaskPriority } from '../../../pages/TaskStudio/types'
import { taskHandlers } from '../../../pages/TaskStudio/handlers/taskHandlers'
import { useToast } from '../../ui/use-toast'

type RecurringPattern = 'none' | 'daily' | 'weekly' | 'monthly'

interface TaskComposerProps {
  onBack?: () => void
  onTaskCreated?: () => void
}

function formatDateTimeLocal(date: Date): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${hh}:${mm}`
}

function parseDateTimeLocal(value: string): Date {
  if (!value) return new Date()
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return new Date(value)
  const [y, m, d] = datePart.split('-').map(n => parseInt(n, 10))
  const [hh, mm] = timePart.split(':').map(n => parseInt(n, 10))
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0)
}

export function TaskComposer({ onBack, onTaskCreated }: TaskComposerProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>('none')
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 1)
    return date
  })
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    priority: 'medium',
    scheduledDate: new Date(),
    estimatedDuration: 60,
    tags: [],
    assignedTo: ''
  })

  const handleInputChange = (field: keyof CreateTaskData, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setFormData(prev => ({
      ...prev,
      tags
    }))
  }

  const generateRecurringTasks = (baseTask: CreateTaskData, pattern: RecurringPattern, endDate: Date): CreateTaskData[] => {
    const tasks: CreateTaskData[] = []
    const baseDate = new Date(baseTask.scheduledDate)
    let currentDate = new Date(baseDate)
    let taskCount = 0
    
    while (currentDate <= endDate && taskCount < 100) {
      tasks.push({
        ...baseTask,
        scheduledDate: new Date(currentDate),
        title: taskCount === 0 ? baseTask.title : `${baseTask.title} (${taskCount + 1})`
      })
      
      taskCount++
      
      switch (pattern) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
        default:
          break
      }
    }
    
    return tasks
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a task title',
        variant: 'destructive',
      })
      return
    }

    if (isRecurring && recurringPattern !== 'none') {
      if (endDate <= formData.scheduledDate) {
        toast({
          title: 'Error',
          description: 'End date must be after the start date',
          variant: 'destructive',
        })
        return
      }
    }

    setIsSubmitting(true)
    
    try {
      if (isRecurring && recurringPattern !== 'none') {
        const tasks = generateRecurringTasks(formData, recurringPattern, endDate)
        
        if (tasks.length === 0) {
          toast({
            title: 'Error',
            description: 'No tasks would be created with the selected date range',
            variant: 'destructive',
          })
          return
        }
        
        for (const task of tasks) {
          await taskHandlers.createTask(task)
        }
        
        toast({
          title: 'Success',
          description: `Successfully created ${tasks.length} recurring tasks!`,
        })
      } else {
        await taskHandlers.createTask(formData)
        toast({
          title: 'Success',
          description: 'Task created successfully',
        })
      }
      
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        scheduledDate: new Date(),
        estimatedDuration: 60,
        tags: [],
        assignedTo: ''
      })
      setIsRecurring(false)
      setRecurringPattern('none')
      setEndDate(() => {
        const date = new Date()
        date.setMonth(date.getMonth() + 1)
        return date
      })
      
      onTaskCreated?.()
      onBack?.()
    } catch (error) {
      console.error('Failed to create task(s):', error)
      toast({
        title: 'Error',
        description: 'Failed to create task(s). Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
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
          <Typography variant="h3" className="text-lg font-semibold">
            Create Task
          </Typography>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  handleInputChange('description', e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                placeholder="Enter task description"
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive resize-none min-h-[36px] overflow-hidden"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="scheduledDate">Scheduled Date & Time</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={formatDateTimeLocal(formData.scheduledDate)}
                onChange={(e) => handleInputChange('scheduledDate', parseDateTimeLocal(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as TaskPriority)}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-zinc-800 selection:border-zinc-800 selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:text-white"
              >
                <option value="low" className="dark:bg-zinc-800 dark:text-white">Low</option>
                <option value="medium" className="dark:bg-zinc-800 dark:text-white">Medium</option>
                <option value="high" className="dark:bg-zinc-800 dark:text-white">High</option>
                <option value="urgent" className="dark:bg-zinc-800 dark:text-white">Urgent</option>
              </select>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo || ''}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                placeholder="Enter assignee name or email"
              />
            </div>

            {/* Recurring Event Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isRecurring" className="text-sm font-medium">
                  Create recurring tasks
                </Label>
              </div>

              {isRecurring && (
                <div className="space-y-3 pl-6 border-l-2 border-border">
                  <div>
                    <Label htmlFor="recurringPattern">Repeat Pattern</Label>
                    <select
                      id="recurringPattern"
                      value={recurringPattern}
                      onChange={(e) => setRecurringPattern(e.target.value as RecurringPattern)}
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-zinc-800 selection:border-zinc-800 selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:text-white"
                    >
                      <option value="none" className="dark:bg-zinc-800 dark:text-white">Select pattern</option>
                      <option value="daily" className="dark:bg-zinc-800 dark:text-white">Daily</option>
                      <option value="weekly" className="dark:bg-zinc-800 dark:text-white">Weekly</option>
                      <option value="monthly" className="dark:bg-zinc-800 dark:text-white">Monthly</option>
                    </select>
                  </div>

                  {recurringPattern !== 'none' && (
                    <div>
                      <Label htmlFor="endDate">End On *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate.toISOString().split('T')[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value))}
                        min={formData.scheduledDate.toISOString().split('T')[0]}
                        className="w-full"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Tasks will be created from the start date until this end date
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting 
                  ? 'Creating Task(s)...' 
                  : isRecurring && recurringPattern !== 'none'
                    ? 'Create Recurring Tasks'
                    : 'Create Task'
                }
              </Button>
              {onBack && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

