// Agent context synchronization for multi-agent plan execution
import type { PlanTodo } from '../PlanViewer'
import type { AiTab } from '../../../../pages/Workspaces/types'
import { dispatchPlanTodosInit } from './planTodoBridge'

/**
 * Represents an AI agent (tab) that can be assigned tasks
 */
export interface AgentInfo {
  tabId: string
  threadId: string
  label: string
}

/**
 * Progress summary for context updates
 */
export interface ProgressSummary {
  total: number
  completed: number
  inProgress: number
  pending: number
  failed: number
}

/**
 * Get all available AI tabs as agents
 */
export function getAiTabs(): AgentInfo[] {
  const aiTabs = (window as any).__banburyAiTabs as AiTab[] | undefined
  if (!aiTabs || !Array.isArray(aiTabs)) return []

  return aiTabs.map(tab => ({
    tabId: tab.id,
    threadId: tab.threadId,
    label: tab.label,
  }))
}

/**
 * Get agent info by label (case-insensitive match)
 */
export function getAgentByLabel(label: string): AgentInfo | null {
  const agents = getAiTabs()
  const normalizedLabel = label.toLowerCase().trim()
  return agents.find(a => a.label.toLowerCase().trim() === normalizedLabel) || null
}

/**
 * Get agent info by tabId
 */
export function getAgentByTabId(tabId: string): AgentInfo | null {
  const agents = getAiTabs()
  return agents.find(a => a.tabId === tabId) || null
}

/**
 * Get all unique assignee labels from the plan todos
 */
export function getAssignedAgentLabels(todos: PlanTodo[]): string[] {
  const labels = new Set<string>()
  todos.forEach(todo => {
    if (todo.assigneeLabel) {
      labels.add(todo.assigneeLabel)
    }
  })
  return Array.from(labels)
}

/**
 * Get todos assigned to a specific agent (by label)
 */
export function getTodosForAgent(todos: PlanTodo[], agentLabel: string): PlanTodo[] {
  const normalizedLabel = agentLabel.toLowerCase().trim()
  return todos.filter(
    todo => todo.assigneeLabel?.toLowerCase().trim() === normalizedLabel
  )
}

/**
 * Get unassigned todos
 */
export function getUnassignedTodos(todos: PlanTodo[]): PlanTodo[] {
  return todos.filter(todo => !todo.assigneeLabel)
}

/**
 * Calculate progress summary from todos
 */
export function calculateProgress(todos: PlanTodo[]): ProgressSummary {
  return {
    total: todos.length,
    completed: todos.filter(t => t.status === 'completed').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    pending: todos.filter(t => t.status === 'pending').length,
    failed: todos.filter(t => t.status === 'failed').length,
  }
}

/**
 * Build a context briefing message for an agent
 * Contains plan overview, progress, and only the agent's assigned todos
 */
export function buildAgentBriefing(
  planTitle: string,
  planOverview: string,
  allTodos: PlanTodo[],
  agentLabel: string
): string {
  const agentTodos = getTodosForAgent(allTodos, agentLabel)
  const progress = calculateProgress(allTodos)
  
  let briefing = `## Plan Context Briefing\n\n`
  briefing += `**Plan:** ${planTitle}\n\n`
  
  if (planOverview) {
    // Truncate long overviews
    const maxOverviewLength = 500
    const truncatedOverview = planOverview.length > maxOverviewLength
      ? planOverview.substring(0, maxOverviewLength) + '...'
      : planOverview
    briefing += `**Overview:** ${truncatedOverview}\n\n`
  }
  
  briefing += `**Progress:** ${progress.completed}/${progress.total} completed`
  if (progress.inProgress > 0) briefing += `, ${progress.inProgress} in progress`
  if (progress.failed > 0) briefing += `, ${progress.failed} failed`
  briefing += `\n\n`
  
  briefing += `### Your Assigned Tasks (${agentTodos.length})\n\n`
  
  if (agentTodos.length === 0) {
    briefing += `_No tasks currently assigned to you._\n`
  } else {
    agentTodos.forEach((todo, idx) => {
      const statusIcon = getStatusIcon(todo.status)
      const dependsInfo = todo.depends?.length 
        ? ` (depends on: ${todo.depends.join(', ')})` 
        : ''
      briefing += `${idx + 1}. ${statusIcon} [${todo.id}] ${todo.description}${dependsInfo}\n`
    })
  }
  
  briefing += `\n---\n`
  briefing += `**Instructions:** Only work on the tasks assigned to you above. `
  briefing += `Do not work on tasks assigned to other agents or unassigned tasks. `
  briefing += `Complete each task thoroughly before moving to the next.\n`
  
  return briefing
}

function getStatusIcon(status: PlanTodo['status']): string {
  switch (status) {
    case 'completed': return '✅'
    case 'in_progress': return '🔄'
    case 'failed': return '❌'
    default: return '⏳'
  }
}

/**
 * Build a short progress update message
 */
export function buildProgressUpdate(
  planTitle: string,
  allTodos: PlanTodo[],
  justCompletedTodoId?: string,
  justFailedTodoId?: string
): string {
  const progress = calculateProgress(allTodos)
  
  let update = `**[Plan Progress Update]** ${planTitle}\n`
  update += `${progress.completed}/${progress.total} completed`
  if (progress.inProgress > 0) update += `, ${progress.inProgress} in progress`
  if (progress.failed > 0) update += `, ${progress.failed} failed`
  
  if (justCompletedTodoId) {
    const todo = allTodos.find(t => t.id === justCompletedTodoId)
    if (todo) update += `\n✅ Just completed: ${todo.description}`
  }
  
  if (justFailedTodoId) {
    const todo = allTodos.find(t => t.id === justFailedTodoId)
    if (todo) update += `\n❌ Just failed: ${todo.description}`
  }
  
  return update
}

/**
 * Send a message to a specific AI tab via the assistant-composer-send event
 */
export function sendMessageToAgent(tabId: string, message: string): void {
  window.dispatchEvent(new CustomEvent('assistant-composer-send', {
    detail: { tabId, text: message }
  }))
}

/**
 * Send context briefing to a specific agent
 */
export function sendAgentBriefing(
  agent: AgentInfo,
  planTitle: string,
  planOverview: string,
  allTodos: PlanTodo[]
): void {
  const briefing = buildAgentBriefing(planTitle, planOverview, allTodos, agent.label)
  sendMessageToAgent(agent.tabId, briefing)
}

/**
 * Send context briefings to all agents that have assigned todos
 */
export function sendAllAgentBriefings(
  planTitle: string,
  planOverview: string,
  allTodos: PlanTodo[]
): void {
  const assignedLabels = getAssignedAgentLabels(allTodos)
  
  assignedLabels.forEach(label => {
    const agent = getAgentByLabel(label)
    if (agent) {
      sendAgentBriefing(agent, planTitle, planOverview, allTodos)
    }
  })
}

/**
 * Send progress update to all participating agents
 */
export function sendProgressUpdateToAgents(
  planTitle: string,
  allTodos: PlanTodo[],
  justCompletedTodoId?: string,
  justFailedTodoId?: string
): void {
  const assignedLabels = getAssignedAgentLabels(allTodos)
  const updateMessage = buildProgressUpdate(planTitle, allTodos, justCompletedTodoId, justFailedTodoId)
  
  assignedLabels.forEach(label => {
    const agent = getAgentByLabel(label)
    if (agent) {
      sendMessageToAgent(agent.tabId, updateMessage)
    }
  })
}

/**
 * Initialize an agent's todo store with only its assigned todos
 * This populates the right panel todo list for the agent thread
 */
export function initAgentTodoStore(
  agent: AgentInfo,
  allTodos: PlanTodo[],
  activeTodoId: string | null = null
): void {
  const agentTodos = getTodosForAgent(allTodos, agent.label)
  dispatchPlanTodosInit(agent.threadId, agentTodos, activeTodoId)
}

/**
 * Initialize todo stores for all agents with their assigned todos
 */
export function initAllAgentTodoStores(
  allTodos: PlanTodo[],
  activeTodoId: string | null = null
): void {
  const assignedLabels = getAssignedAgentLabels(allTodos)
  
  assignedLabels.forEach(label => {
    const agent = getAgentByLabel(label)
    if (agent) {
      initAgentTodoStore(agent, allTodos, activeTodoId)
    }
  })
}

/**
 * Get count of agents currently working (have in_progress todos)
 */
export function getActiveAgentCount(todos: PlanTodo[]): number {
  const activeLabels = new Set<string>()
  todos.forEach(todo => {
    if (todo.status === 'in_progress' && todo.assigneeLabel) {
      activeLabels.add(todo.assigneeLabel)
    }
  })
  return activeLabels.size
}

/**
 * Check if all todos for a specific agent are complete
 */
export function isAgentComplete(todos: PlanTodo[], agentLabel: string): boolean {
  const agentTodos = getTodosForAgent(todos, agentLabel)
  if (agentTodos.length === 0) return true
  return agentTodos.every(t => t.status === 'completed')
}

/**
 * Get the next pending todo for a specific agent
 */
export function getNextPendingTodoForAgent(todos: PlanTodo[], agentLabel: string): PlanTodo | null {
  const agentTodos = getTodosForAgent(todos, agentLabel)
  return agentTodos.find(t => t.status === 'pending') || null
}

/**
 * Create a new agent (AI tab) with the given label
 * Dispatches an event that RightPanel listens for
 */
export function createNewAgent(label?: string): void {
  window.dispatchEvent(new CustomEvent('create-new-ai-tab', {
    detail: { label }
  }))
}
