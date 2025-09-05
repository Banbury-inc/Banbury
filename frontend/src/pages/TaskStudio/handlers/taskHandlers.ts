import { Task, CreateTaskData, UpdateTaskData, TaskStatus } from '../types'
import { ApiService } from '../../../services/apiService'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface TasksResponse {
  success: boolean
  tasks: Task[]
  count: number
  error?: string
}

interface TaskResponse {
  success: boolean
  task: Task
  message?: string
  error?: string
}

interface ProcessDueResponse {
  success: boolean
  processed: Array<{ id: string, status: string }>
  count: number
  error?: string
}

export const taskHandlers = {
  // Get all tasks
  getTasks: async (status?: TaskStatus): Promise<Task[]> => {
    try {
      const params = status ? `?status=${status}` : ''
      const response = await ApiService.get<TasksResponse>(`/tasks/taskstudio/${params}`)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tasks')
      }
      
      return response.tasks.map((t: any) => ({
        ...t,
        scheduledDate: new Date(t.scheduledDate),
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })) as Task[]
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw new Error('Failed to fetch tasks')
    }
  },

  // Get tasks by status
  getTasksByStatus: async (status: TaskStatus): Promise<Task[]> => {
    return taskHandlers.getTasks(status)
  },

  // Create a new task
  createTask: async (taskData: CreateTaskData): Promise<Task> => {
    try {
      const response = await ApiService.post<TaskResponse>('/tasks/taskstudio/create/', taskData)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create task')
      }
      
      const t: any = response.task
      return {
        ...t,
        scheduledDate: new Date(t.scheduledDate),
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      } as Task
    } catch (error) {
      console.error('Error creating task:', error)
      throw new Error('Failed to create task')
    }
  },

  // Update an existing task
  updateTask: async (taskData: UpdateTaskData): Promise<Task> => {
    try {
      const { id, ...updateData } = taskData
      const response = await ApiService.put<TaskResponse>(`/tasks/taskstudio/${id}/update/`, updateData)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update task')
      }
      
      const t: any = response.task
      return {
        ...t,
        scheduledDate: new Date(t.scheduledDate),
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      } as Task
    } catch (error) {
      console.error('Error updating task:', error)
      throw new Error('Failed to update task')
    }
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      const response = await ApiService.delete<ApiResponse<void>>(`/tasks/taskstudio/${taskId}/delete/`)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      throw new Error('Failed to delete task')
    }
  },

  // Batch delete multiple tasks by calling individual delete for each
  batchDeleteTasks: async (taskIds: string[]): Promise<void> => {
    try {
      // Delete each task individually
      const deletePromises = taskIds.map(taskId => taskHandlers.deleteTask(taskId))
      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Error batch deleting tasks:', error)
      throw new Error('Failed to delete tasks')
    }
  },

  // Start a task (change status to running)
  startTask: async (taskId: string): Promise<Task> => {
    try {
      const response = await ApiService.post<TaskResponse>(`/tasks/taskstudio/${taskId}/status/`, {
        status: 'running'
      })
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to start task')
      }
      
      const t: any = response.task
      return {
        ...t,
        scheduledDate: new Date(t.scheduledDate),
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      } as Task
    } catch (error) {
      console.error('Error starting task:', error)
      throw new Error('Failed to start task')
    }
  },

  // Complete a task (change status to completed)
  completeTask: async (taskId: string): Promise<Task> => {
    try {
      const response = await ApiService.post<TaskResponse>(`/tasks/taskstudio/${taskId}/status/`, {
        status: 'completed'
      })
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to complete task')
      }
      
      const t: any = response.task
      return {
        ...t,
        scheduledDate: new Date(t.scheduledDate),
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      } as Task
    } catch (error) {
      console.error('Error completing task:', error)
      throw new Error('Failed to complete task')
    }
  },

  // Cancel a task (change status to cancelled)
  cancelTask: async (taskId: string): Promise<Task> => {
    try {
      const response = await ApiService.post<TaskResponse>(`/tasks/taskstudio/${taskId}/status/`, {
        status: 'cancelled'
      })
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel task')
      }
      
      const t: any = response.task
      return {
        ...t,
        scheduledDate: new Date(t.scheduledDate),
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      } as Task
    } catch (error) {
      console.error('Error cancelling task:', error)
      throw new Error('Failed to cancel task')
    }
  }
  ,

  // Process due tasks via Next API (which invokes LangGraph)
  processDueTasks: async (): Promise<{ count: number }> => {
    try {
      // Use relative Next.js API route to process due tasks server-side if available
      const resp = await fetch('/api/taskstudio/process-due', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // forward auth token for backend calls inside the route
          ...(typeof window !== 'undefined' && localStorage.getItem('authToken')
            ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            : {})
        },
        body: JSON.stringify({})
      })
      if (resp.ok) {
        const data = await resp.json()
        if (data?.success) return { count: data.count || 0 }
      }

      // Fallback to client-driven streaming using langgraph-stream directly
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || '' : ''

      // 1) Get scheduled tasks
      const getResp = await fetch(`${origin}${ApiService['baseURL']}/tasks/taskstudio/?status=scheduled`, {
        headers: token ? { Authorization: `Bearer ${token}` } as any : undefined
      })
      const getData: any = await getResp.json()
      const tasks = Array.isArray(getData?.tasks) ? getData.tasks : []
      const now = new Date()
      const due = tasks.filter((t: any) => t?.scheduledDate && new Date(t.scheduledDate) <= now)

      let processed = 0
      for (const task of due) {
        const description = task?.description || ''
        const streamResp = await fetch('/api/assistant/langgraph-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            messages: [ { role: 'user', content: [ { type: 'text', text: description } ] } ],
            recursionLimit: 500
          })
        })
        if (!streamResp.ok || !(streamResp as any).body) continue
        const reader = (streamResp as any).body.getReader()
        const decoder = new TextDecoder()
        let fullText = ''
        let buffer = ''
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const events = buffer.split('\n\n')
          buffer = events.pop() || ''
          for (const evt of events) {
            const line = evt.trim()
            if (!line.startsWith('data:')) continue
            const jsonStr = line.slice(5).trim()
            if (!jsonStr) continue
            try {
              const event = JSON.parse(jsonStr)
              if (event?.type === 'text-delta' && typeof event.text === 'string') fullText += event.text
            } catch {}
          }
        }

        await ApiService.put(`/tasks/taskstudio/${encodeURIComponent(task.id)}/update/`, { status: 'completed', result: fullText })

        // Save conversation best-effort
        try {
          const title = task?.title ? `Task: ${task.title}` : 'Scheduled Task'
          await ApiService.post('/conversations/save/', {
            title,
            messages: [
              { role: 'user', content: [{ type: 'text', text: description }] },
              { role: 'assistant', content: [{ type: 'text', text: fullText }] }
            ],
            metadata: { taskId: task.id }
          })
        } catch {}
        processed += 1
      }

      return { count: processed }
    } catch (error) {
      console.error('Error processing due tasks:', error)
      throw new Error('Failed to process due tasks')
    }
  }
}
