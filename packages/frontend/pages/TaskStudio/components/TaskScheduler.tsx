import { useState } from 'react'
import { Button } from '../../../components/common/ui/button'
import { Input } from '../../../components/common/ui/old-input'
import { Label } from '../../../components/common/ui/label'
import { Card } from '../../../components/common/ui/card'
import { CreateTaskData, TaskPriority } from '../types'
import { taskHandlers } from '../handlers/taskHandlers'

type RecurringPattern = 'none' | 'daily' | 'weekly' | 'monthly'

interface TaskSchedulerProps {
  onTaskCreated: () => void
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
  // value is like 2025-09-05T14:30 (local time)
  if (!value) return new Date()
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return new Date(value)
  const [y, m, d] = datePart.split('-').map(n => parseInt(n, 10))
  const [hh, mm] = timePart.split(':').map(n => parseInt(n, 10))
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0)
}

export function TaskScheduler({ onTaskCreated }: TaskSchedulerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>('none')
  const [recurringCount, setRecurringCount] = useState(5)
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 1) // Default to 1 month from now
    return date
  })
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    priority: 'medium',
    scheduledDate: new Date(),
    estimatedDuration: 60,
    tags: [],
    assignedTo: '',
    attachedFiles: []
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files)
      setAttachedFiles(prev => [...prev, ...newFiles])
      setFormData(prev => ({
        ...prev,
        attachedFiles: [...(prev.attachedFiles || []), ...newFiles]
      }))
    }
  }

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({
      ...prev,
      attachedFiles: (prev.attachedFiles || []).filter((_, i) => i !== index)
    }))
  }

  const generateRecurringTasks = (baseTask: CreateTaskData, pattern: RecurringPattern, endDate: Date): CreateTaskData[] => {
    const tasks: CreateTaskData[] = []
    const baseDate = new Date(baseTask.scheduledDate)
    let currentDate = new Date(baseDate)
    let taskCount = 0
    
    while (currentDate <= endDate && taskCount < 100) { // Safety limit of 100 tasks
      tasks.push({
        ...baseTask,
        scheduledDate: new Date(currentDate),
        title: taskCount === 0 ? baseTask.title : `${baseTask.title} (${taskCount + 1})`
      })
      
      taskCount++
      
      // Calculate next date based on pattern
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
      alert('Please enter a task title')
      return
    }

    if (isRecurring && recurringPattern !== 'none') {
      if (endDate <= formData.scheduledDate) {
        alert('End date must be after the start date')
        return
      }
    }

    setIsSubmitting(true)
    
    try {
      if (isRecurring && recurringPattern !== 'none') {
        // Create multiple recurring tasks
        const tasks = generateRecurringTasks(formData, recurringPattern, endDate)
        
        if (tasks.length === 0) {
          alert('No tasks would be created with the selected date range')
          return
        }
        
        // Create tasks sequentially to avoid overwhelming the server
        for (const task of tasks) {
          await taskHandlers.createTask(task)
        }
        
        alert(`Successfully created ${tasks.length} recurring tasks!`)
      } else {
        // Create single task
        await taskHandlers.createTask(formData)
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        scheduledDate: new Date(),
        estimatedDuration: 60,
        tags: [],
        assignedTo: '',
        attachedFiles: []
      })
      setAttachedFiles([])
      setIsRecurring(false)
      setRecurringPattern('none')
      setRecurringCount(5)
      setEndDate(() => {
        const date = new Date()
        date.setMonth(date.getMonth() + 1)
        return date
      })
      
      onTaskCreated()
    } catch (error) {
      console.error('Failed to create task(s):', error)
      alert('Failed to create task(s). Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
              // Auto-resize the textarea
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            placeholder="Enter task description"
            className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive resize-none min-h-[36px] overflow-hidden"
            rows={1}
          />
        </div>

        {/* File Attachments Section */}
        <div>
          <Label htmlFor="fileAttachment">Attach Files</Label>
          <Input
            id="fileAttachment"
            type="file"
            multiple
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {attachedFiles.length > 0 && (
            <div className="mt-2 space-y-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                >
                  <span className="truncate flex-1">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="ml-2 text-destructive hover:text-destructive/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
                  <option value="none" className="dark:bg-zinc-800 dark:text-white border-zinc-800">Select pattern</option>
                  <option value="daily" className="dark:bg-zinc-800 dark:text-white border-zinc-800">Daily</option>
                  <option value="weekly" className="dark:bg-zinc-800 dark:text-white border-zinc-800">Weekly</option>
                  <option value="monthly" className="dark:bg-zinc-800 dark:text-white border-zinc-800">Monthly</option>
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

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting 
            ? 'Creating Task(s)...' 
            : isRecurring && recurringPattern !== 'none'
              ? 'Create Recurring Tasks'
              : 'Schedule Task'
          }
        </Button>
      </form>
  )
}
