// Plan execution utilities for multi-agent parallel task execution
import type { Plan, PlanTodo } from '../PlanViewer'
import type { AiTab } from '../../../../pages/Workspaces/types'
import { getAgentByLabel, sendMessageToAgent } from './planAgentContext'
import { dispatchActiveTodoChange, dispatchPlanTodoUpdate } from './planTodoBridge'

/**
 * Extended agent info with both id and tabId for compatibility
 */
export interface ExecutionAgentInfo {
  id: string      // Same as tabId, used for tracking
  tabId: string
  threadId: string
  label: string
}

/**
 * Progress tracking for parallel execution
 */
export interface ExecutionProgress {
  total: number
  completed: number
  inProgress: number
  pending: number
  failed: number
  activeAgents: string[]
}

/**
 * Options for executeParallel
 */
interface ExecuteParallelOptions {
  plan: Plan
  selectedTodos?: Set<string>
  onStatusChange?: (todoId: string, status: PlanTodo['status']) => void
  onProgressChange?: (progress: ExecutionProgress) => void
  abortSignal?: AbortSignal
}

/**
 * Result of parallel execution
 */
interface ExecuteParallelResult {
  success: boolean
  completedCount: number
  failedCount: number
}

/**
 * Get all available AI agents from window.__banburyAiTabs
 * Returns agents with both id and tabId for compatibility
 */
export function getAvailableAgents(): ExecutionAgentInfo[] {
  const aiTabs = (window as any).__banburyAiTabs as AiTab[] | undefined
  if (!aiTabs || !Array.isArray(aiTabs)) return []

  return aiTabs.map(tab => ({
    id: tab.id,        // Used for tracking in-progress todos
    tabId: tab.id,     // Same value, used in component keys
    threadId: tab.threadId,
    label: tab.label,
  }))
}

/**
 * Calculate current execution progress
 */
function calculateProgress(todos: PlanTodo[], activeAgents: string[]): ExecutionProgress {
  return {
    total: todos.length,
    completed: todos.filter(t => t.status === 'completed').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    pending: todos.filter(t => t.status === 'pending').length,
    failed: todos.filter(t => t.status === 'failed').length,
    activeAgents,
  }
}

/**
 * Check if a todo's dependencies are all completed
 */
function areDependenciesMet(todo: PlanTodo, allTodos: PlanTodo[]): boolean {
  if (!todo.depends || todo.depends.length === 0) return true
  
  return todo.depends.every(depId => {
    const depTodo = allTodos.find(t => t.id === depId)
    return depTodo?.status === 'completed'
  })
}

/**
 * Get the next pending todo for an agent that has dependencies met
 */
function getNextTodoForAgent(
  todos: PlanTodo[],
  agentLabel: string,
  allTodos: PlanTodo[]
): PlanTodo | null {
  const normalizedLabel = agentLabel.toLowerCase().trim()
  
  return todos.find(t => 
    t.status === 'pending' &&
    t.assigneeLabel?.toLowerCase().trim() === normalizedLabel &&
    areDependenciesMet(t, allTodos)
  ) || null
}

/**
 * Execute todos in parallel across multiple agents
 * Each agent works on their assigned todos sequentially
 */
export async function executeParallel(
  options: ExecuteParallelOptions
): Promise<ExecuteParallelResult> {
  const { plan, selectedTodos, onStatusChange, onProgressChange, abortSignal } = options
  
  // Get todos to execute
  const todosToExecute = selectedTodos 
    ? plan.todos.filter(t => selectedTodos.has(t.id))
    : plan.todos.filter(t => t.status !== 'completed')
  
  if (todosToExecute.length === 0) {
    return { success: true, completedCount: 0, failedCount: 0 }
  }

  // Track execution state
  const todoStates = new Map<string, PlanTodo['status']>(
    todosToExecute.map(t => [t.id, t.status])
  )
  const activeAgents = new Set<string>()
  let completedCount = 0
  let failedCount = 0

  // Helper to update progress
  const updateProgress = () => {
    const currentTodos = todosToExecute.map(t => ({
      ...t,
      status: todoStates.get(t.id) || t.status
    }))
    onProgressChange?.(calculateProgress(currentTodos, Array.from(activeAgents)))
  }

  // Helper to update a todo's status
  const updateStatus = (todoId: string, status: PlanTodo['status']) => {
    todoStates.set(todoId, status)
    onStatusChange?.(todoId, status)
    
    if (status === 'completed') completedCount++
    if (status === 'failed') failedCount++
    
    updateProgress()
  }

  // Get unique agent labels from todos
  const agentLabels = new Set<string>()
  todosToExecute.forEach(t => {
    if (t.assigneeLabel) agentLabels.add(t.assigneeLabel)
  })

  // If no agents assigned, use the first available agent
  const availableAgents = getAvailableAgents()
  if (agentLabels.size === 0 && availableAgents.length > 0) {
    agentLabels.add(availableAgents[0].label)
  }

  // Create a promise for each agent to process their todos
  const agentPromises = Array.from(agentLabels).map(async (agentLabel) => {
    const agent = getAgentByLabel(agentLabel)
    if (!agent) {
      console.warn(`Agent not found for label: ${agentLabel}`)
      return
    }

    activeAgents.add(agentLabel)
    updateProgress()

    // Process todos assigned to this agent sequentially
    while (!abortSignal?.aborted) {
      // Get all current todos with their current states
      const currentTodos = todosToExecute.map(t => ({
        ...t,
        status: todoStates.get(t.id) || t.status
      }))

      // Find next pending todo for this agent
      const nextTodo = getNextTodoForAgent(currentTodos, agentLabel, currentTodos)
      if (!nextTodo) break // No more todos for this agent

      // Mark as in-progress
      updateStatus(nextTodo.id, 'in_progress')
      dispatchActiveTodoChange(agent.threadId, nextTodo.id)
      dispatchPlanTodoUpdate(agent.threadId, nextTodo.id, 'in_progress')

      // Send the task to the agent
      const taskMessage = buildTaskMessage(nextTodo, plan)
      sendMessageToAgent(agent.tabId, taskMessage)

      // Wait for completion (via event listener)
      const result = await waitForTodoCompletion(nextTodo.id, abortSignal)
      
      if (result === 'completed') {
        updateStatus(nextTodo.id, 'completed')
        dispatchPlanTodoUpdate(agent.threadId, nextTodo.id, 'completed')
      } else {
        updateStatus(nextTodo.id, 'failed')
        dispatchPlanTodoUpdate(agent.threadId, nextTodo.id, 'failed')
      }
      
      dispatchActiveTodoChange(agent.threadId, null)
    }

    activeAgents.delete(agentLabel)
    updateProgress()
  })

  // Wait for all agents to complete
  await Promise.all(agentPromises)

  const allCompleted = completedCount === todosToExecute.length
  return {
    success: allCompleted && failedCount === 0,
    completedCount,
    failedCount,
  }
}

/**
 * Build a task message for an agent
 */
function buildTaskMessage(todo: PlanTodo, plan: Plan): string {
  let message = `## Task: ${todo.description}\n\n`
  message += `**Task ID:** ${todo.id}\n\n`
  
  if (todo.depends && todo.depends.length > 0) {
    const depDescriptions = todo.depends
      .map(depId => plan.todos.find(t => t.id === depId)?.description || depId)
      .join(', ')
    message += `**Dependencies (completed):** ${depDescriptions}\n\n`
  }
  
  message += `Please complete this task. When finished, the system will automatically detect completion.\n`
  
  return message
}

/**
 * Wait for a todo to be completed or failed
 * Listens for the assistant-plan-task-complete event
 */
function waitForTodoCompletion(
  todoId: string,
  abortSignal?: AbortSignal
): Promise<'completed' | 'failed' | 'aborted'> {
  return new Promise((resolve) => {
    // Check if already aborted
    if (abortSignal?.aborted) {
      resolve('aborted')
      return
    }

    const handleComplete = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.taskId === todoId) {
        cleanup()
        resolve(detail.success ? 'completed' : 'failed')
      }
    }

    const handleAbort = () => {
      cleanup()
      resolve('aborted')
    }

    const cleanup = () => {
      window.removeEventListener('assistant-plan-task-complete', handleComplete)
      abortSignal?.removeEventListener('abort', handleAbort)
    }

    window.addEventListener('assistant-plan-task-complete', handleComplete)
    abortSignal?.addEventListener('abort', handleAbort)
  })
}
