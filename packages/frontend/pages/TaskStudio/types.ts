export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  scheduledDate: Date
  estimatedDuration: number // in minutes
  createdAt: Date
  updatedAt: Date
  tags?: string[]
  assignedTo?: string
  result?: string
  error?: string
}

export type TaskStatus = 'scheduled' | 'running' | 'completed' | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface CreateTaskData {
  title: string
  description: string
  priority: TaskPriority
  scheduledDate: Date
  estimatedDuration: number
  tags?: string[]
  assignedTo?: string
}

export interface UpdateTaskData {
  id: string
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  scheduledDate?: Date
  estimatedDuration?: number
  tags?: string[]
  assignedTo?: string
}
