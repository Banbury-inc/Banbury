import { useState, useEffect, useCallback, useRef } from "react"
import type { SVGProps } from "react"
import {
  Users,
  Loader2 as LucideLoader2,
  Save,
  StopCircle,
  CheckCircle2,
  Check as LucideCheck,
  Circle,
  AlertCircle,
  RefreshCw,
  ListTodo,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Bot
} from "lucide-react"
import { Button } from "../../common/ui/button"
import { Typography } from "../../common/ui/typography"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../common/ui/select"
import { cn } from "../../../utils"
import styles from "../../../styles/scrollbar.module.css"
import { PlanTiptapEditor } from "./PlanTiptapEditor"
import { ApiService } from "../../../../backend/api/apiService"
import { FileSystemItem } from "../../../utils/fileTreeUtils"
import {
  dispatchPlanTodosInit,
  dispatchPlanTodoUpdate,
  dispatchActiveTodoChange,
  getActiveThreadId,
} from "./handlers/planTodoBridge"
import {
  markTodoCompletedInMarkdown,
  buildPersistedPlanContent,
} from "./handlers/planPersistence"
import {
  executeParallel,
  getAvailableAgents,
  type ExecutionProgress,
  type AgentInfo,
} from "./handlers/planExecution"
import {
  getAiTabs,
  getAgentByLabel,
  getAssignedAgentLabels,
  sendAllAgentBriefings,
  sendProgressUpdateToAgents,
  initAllAgentTodoStores,
  initAgentTodoStore,
} from "./handlers/planAgentContext"

// Custom SVG components matching ToolCallCard
const Loader2 = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
)

const Check = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export interface PlanTodo {
  id: string
  description: string
  status: "pending" | "in_progress" | "completed" | "failed"
  depends?: string[]
  assigneeLabel?: string
}

export interface Plan {
  id: string
  title: string
  overview: string
  todos: PlanTodo[]
  notes: string
  status: "draft" | "executing" | "completed" | "failed"
  createdAt: string
  fileId?: string
}

interface PlanViewerProps {
  file: FileSystemItem
  userInfo: {
    username: string
    email?: string
  } | null
  onSaveComplete?: () => void
}

// Transform "Chat X" labels to "Agent X" for display
function formatAgentLabel(label: string): string {
  return label.replace(/^Chat\s+/i, "Agent ")
}

export function PlanViewer({ file, userInfo, onSaveComplete }: PlanViewerProps) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editMarkdown, setEditMarkdown] = useState("")
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set())
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentTodoId, setCurrentTodoId] = useState<string | null>(null)
  const [todosExpanded, setTodosExpanded] = useState(true)
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([])
  const [activeAgentLabels, setActiveAgentLabels] = useState<Set<string>>(new Set())
  const [executionProgress, setExecutionProgress] = useState<ExecutionProgress | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  // Track which todos are in-progress per agent tab (for cancellation)
  const inProgressTodosRef = useRef<Map<string, string | null>>(new Map())
  const lastFetchKeyRef = useRef<string | null>(null)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  
  // Sync available agents from window.__banburyAiTabs using the shared helper
  useEffect(() => {
    function syncAgents() {
      setAvailableAgents(getAvailableAgents())
    }
    
    // Initial sync
    syncAgents()
    
    // Poll for changes (since AI tabs can be created/renamed externally)
    const interval = setInterval(syncAgents, 1000)
    return () => clearInterval(interval)
  }, [])

  // Parse markdown into Plan object
  const parsePlanMarkdown = useCallback((markdown: string, fallbackTitle: string): Plan => {
    const todos: PlanTodo[] = []
    let title = fallbackTitle
    let overview = ""
    let notes = ""

    // Extract title from # heading (single #, not ##)
    const titleMatch = markdown.match(/^#\s+([^#\n].+)$/m)
    if (titleMatch) title = titleMatch[1].trim()

    // Extract overview section - capture everything from ## Overview until ## Todos or ## Notes
    // This allows nested ### and #### headers within the overview
    const overviewMatch = markdown.match(/##\s+Overview\s*\n([\s\S]*?)(?=\n##\s+(?:Todos?|Notes|Plan Guidelines)|$)/i)
    if (overviewMatch) overview = overviewMatch[1].trim()

    // Extract todos - match lines like: - [ ] id:xxx | description or - [ ] description
    // Only look in the Todos section to avoid picking up bullet points from overview
    const todosSection = markdown.match(/##\s+Todos?\s*\n([\s\S]*?)(?=\n##|$)/i)
    if (todosSection) {
      const todoRegex = /^-\s*\[([x\s])\]\s*(?:id:(\S+)\s*\|\s*)?(.+)$/gm
      let match
      let todoIndex = 0
      while ((match = todoRegex.exec(todosSection[1])) !== null) {
        const isCompleted = match[1].toLowerCase() === "x"
        const id = match[2] || `todo-${todoIndex}`
        const description = match[3].trim()
        
        // Check for depends: annotation
        const dependsMatch = description.match(/\(depends:\s*([^)]+)\)/)
        const depends = dependsMatch 
          ? dependsMatch[1].split(",").map(d => d.trim())
          : undefined
        
        // Check for agent: annotation
        const agentMatch = description.match(/\(agent:\s*([^)]+)\)/)
        const assigneeLabel = agentMatch ? agentMatch[1].trim() : undefined
        
        // Clean description by removing both annotations
        const cleanDescription = description
          .replace(/\s*\(depends:[^)]+\)/, "")
          .replace(/\s*\(agent:[^)]+\)/, "")
          .trim()

        todos.push({
          id,
          description: cleanDescription,
          status: isCompleted ? "completed" : "pending",
          depends,
          assigneeLabel,
        })
        todoIndex++
      }
    }

    // Extract notes section - capture everything including nested headers
    const notesMatch = markdown.match(/##\s+Notes\s*\n([\s\S]*?)(?=\n##\s+Plan Guidelines|$)/i)
    if (notesMatch) notes = notesMatch[1].trim()

    return {
      id: file.file_id || `plan-${Date.now()}`,
      title,
      overview,
      todos,
      notes,
      status: "draft",
      createdAt: new Date().toISOString(),
      fileId: file.file_id,
    }
  }, [file.file_id])

  // Convert Plan to markdown
  const planToMarkdown = useCallback((p: Plan): string => {
    let md = `# ${p.title}\n\n`
    md += `## Overview\n${p.overview}\n\n`
    md += `## To-Dos\n`
    p.todos.forEach(todo => {
      const checkbox = todo.status === "completed" ? "[x]" : "[ ]"
      const depends = todo.depends?.length ? ` (depends: ${todo.depends.join(", ")})` : ""
      const agent = todo.assigneeLabel ? ` (agent: ${todo.assigneeLabel})` : ""
      md += `- ${checkbox} id:${todo.id} | ${todo.description}${depends}${agent}\n`
    })
    md += `\n## Notes\n${p.notes}\n`
    return md
  }, [])

  // Auto-assign first agent to todos without an assignee
  useEffect(() => {
    if (!plan || availableAgents.length === 0) return
    
    const firstAgentLabel = availableAgents[0].label
    const unassignedTodos = plan.todos.filter(t => !t.assigneeLabel)
    
    if (unassignedTodos.length > 0) {
      const updatedTodos = plan.todos.map(t => 
        !t.assigneeLabel ? { ...t, assigneeLabel: firstAgentLabel } : t
      )
      const updatedPlan = { ...plan, todos: updatedTodos }
      
      setPlan(updatedPlan)
      // Also update the markdown to persist the assignment
      setEditMarkdown(planToMarkdown(updatedPlan))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, availableAgents])

  // Load the plan file
  useEffect(() => {
    const loadPlan = async () => {
      const fetchKey = `${file.file_id}|${file.name}`
      if (lastFetchKeyRef.current === fetchKey) return
      lastFetchKeyRef.current = fetchKey

      if (!file.file_id) {
        setError("No file ID available")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await ApiService.downloadFromS3(file.file_id, file.name)
        if (result.success && result.blob) {
          const text = await result.blob.text()
          
          // Check if it's JSON or markdown
          if (file.name.endsWith(".json")) {
            const parsed = JSON.parse(text)
            setPlan(parsed)
            setEditMarkdown(planToMarkdown(parsed))
          } else {
            const parsed = parsePlanMarkdown(text, file.name.replace(/\.plan\.md$/i, ""))
            setPlan(parsed)
            setEditMarkdown(text)
          }
        } else {
          setError("Failed to load plan file")
        }
      } catch (err) {
        console.error("Error loading plan:", err)
        setError("Failed to load plan file")
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [file.file_id, file.name, parsePlanMarkdown, planToMarkdown])

  // Save the plan
  const handleSave = useCallback(async () => {
    if (!plan || !file.file_id || !userInfo?.username) return

    setSaving(true)
    try {
      // Parse the edited markdown back into the plan
      const updatedPlan = parsePlanMarkdown(editMarkdown, plan.title)

      // Save based on file type
      const content = file.name.endsWith(".json")
        ? JSON.stringify(updatedPlan, null, 2)
        : planToMarkdown(updatedPlan)

      const blob = new Blob([content], { 
        type: file.name.endsWith(".json") ? "application/json" : "text/markdown"
      })

      const result = await ApiService.Files.updateS3File(
        file.file_id,
        blob,
        file.name,
        { file_type: blob.type }
      )

      if (result.success) {
        setPlan(updatedPlan)
        onSaveComplete?.()
      } else {
        throw new Error(result.message || "Failed to save")
      }
    } catch (err) {
      console.error("Error saving plan:", err)
    } finally {
      setSaving(false)
    }
  }, [plan, file.file_id, file.name, userInfo?.username, editMarkdown, parsePlanMarkdown, planToMarkdown, onSaveComplete])

  // Toggle todo selection
  const toggleTodoSelection = useCallback((todoId: string) => {
    setSelectedTodos(prev => {
      const next = new Set(prev)
      if (next.has(todoId)) {
        next.delete(todoId)
      } else {
        next.add(todoId)
      }
      return next
    })
  }, [])

  // Update todo status
  const updateTodoStatus = useCallback((todoId: string, status: PlanTodo["status"]) => {
    setPlan(prev => {
      if (!prev) return prev
      return {
        ...prev,
        todos: prev.todos.map(t => t.id === todoId ? { ...t, status } : t),
      }
    })
    
    // Bridge: dispatch todo update to Right Panel todo store
    const threadId = getActiveThreadId()
    if (threadId) {
      dispatchPlanTodoUpdate(threadId, todoId, status)
    }
  }, [])

  // Update todo assignee (agent assignment)
  const updateTodoAssignee = useCallback((todoId: string, assigneeLabel: string) => {
    setPlan(prev => {
      if (!prev) return prev
      const updatedTodos = prev.todos.map(t => 
        t.id === todoId ? { ...t, assigneeLabel } : t
      )
      const updatedPlan = { ...prev, todos: updatedTodos }
      
      // Also update the markdown to persist the assignment
      setEditMarkdown(planToMarkdown(updatedPlan))
      
      return updatedPlan
    })
  }, [planToMarkdown])

  // Add a new agent (creates a new AI tab)
  const handleAddAgent = useCallback(() => {
    // Dispatch event to create a new AI tab
    // The label will be auto-generated (e.g., "Chat 2", "Chat 3", etc.)
    window.dispatchEvent(new CustomEvent('create-new-ai-tab'))
    
    // Also open the AI panel to make it visible
    window.dispatchEvent(new CustomEvent('open-ai-panel'))
  }, [])

  // Persist todo completion to file (updates markdown + saves to S3)
  const persistTodoCompletion = useCallback(async (todoId: string, updatedPlan: Plan) => {
    if (!file.file_id) return

    // Queue saves to avoid overlapping requests
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        // Update the markdown to mark this todo as completed
        const updatedMarkdown = markTodoCompletedInMarkdown(editMarkdown, todoId)
        
        // Update the editor content so it reflects the change
        setEditMarkdown(updatedMarkdown)

        // Build the content to persist
        const { content, mimeType } = buildPersistedPlanContent(
          file.name,
          updatedMarkdown,
          updatedPlan
        )

        const blob = new Blob([content], { type: mimeType })

        const result = await ApiService.Files.updateS3File(
          file.file_id!,
          blob,
          file.name,
          { file_type: mimeType }
        )

        if (!result.success) {
          console.error('[PlanViewer] Failed to autosave todo completion:', result.message)
        }
      } catch (err) {
        console.error('[PlanViewer] Error autosaving todo completion:', err)
      }
    })

    return saveQueueRef.current
  }, [file.file_id, file.name, editMarkdown])

  // Execute plan - uses parallel execution when todos have agent assignments
  // Each agent runs its assigned todos sequentially, but multiple agents work in parallel
  const executeSequential = useCallback(async () => {
    if (!plan) return

    // Switch to agent mode (not plan mode) when running a plan
    window.dispatchEvent(new CustomEvent('assistant-switch-to-agent-mode'))

    setIsExecuting(true)
    abortControllerRef.current = new AbortController()
    inProgressTodosRef.current = new Map()

    // Check if we have any agent assignments
    const assignedLabels = getAssignedAgentLabels(plan.todos)
    const hasAgentAssignments = assignedLabels.length > 0

    // If we have agent assignments, send briefings and init their todo stores
    if (hasAgentAssignments) {
      sendAllAgentBriefings(plan.title, plan.overview, plan.todos)
      initAllAgentTodoStores(plan.todos, null)
    }

    try {
      const result = await executeParallel(
        {
          plan,
          // No selectedTodos means run all incomplete todos
          selectedTodos: undefined,
          onStatusChange: (todoId, status) => {
            updateTodoStatus(todoId, status)
            
            // Track which todo is in-progress for each agent
            if (status === 'in_progress') {
              const todo = plan.todos.find(t => t.id === todoId)
              if (todo) {
                const agentLabel = todo.assigneeLabel || 'unassigned'
                const agents = getAvailableAgents()
                const agent = agents.find(a => a.label.toLowerCase() === agentLabel.toLowerCase()) || agents[0]
                if (agent) {
                  inProgressTodosRef.current.set(agent.id, todoId)
                }
              }
              setCurrentTodoId(todoId)
            } else if (status === 'completed' || status === 'failed') {
              // Clear from in-progress tracking
              for (const [agentId, tid] of inProgressTodosRef.current.entries()) {
                if (tid === todoId) {
                  inProgressTodosRef.current.set(agentId, null)
                  break
                }
              }
            }
            
            // Persist completion
            if (status === 'completed') {
              setPlan(currentPlan => {
                if (currentPlan) {
                  const updatedPlan = {
                    ...currentPlan,
                    todos: currentPlan.todos.map(t => 
                      t.id === todoId ? { ...t, status: "completed" as const } : t
                    ),
                  }
                  persistTodoCompletion(todoId, updatedPlan)
                }
                return currentPlan
              })
              
              // Send progress update
              if (hasAgentAssignments) {
                sendProgressUpdateToAgents(plan.title, plan.todos, todoId, undefined)
              }
            } else if (status === 'failed') {
              if (hasAgentAssignments) {
                sendProgressUpdateToAgents(plan.title, plan.todos, undefined, todoId)
              }
            }
          },
          onProgressChange: (progress) => {
            setExecutionProgress(progress)
            setActiveAgentLabels(progress.activeAgents)
          },
          onComplete: () => {
            setExecutionProgress(null)
            setActiveAgentLabels(new Set())
          },
        },
        abortControllerRef.current
      )
      
      // Update plan status based on results
      if (result.failedCount === 0 && result.completedCount === plan.todos.length) {
        setPlan(prev => prev ? { ...prev, status: "completed" } : prev)
      } else if (result.failedCount > 0 && result.completedCount === 0) {
        setPlan(prev => prev ? { ...prev, status: "failed" } : prev)
      }
    } catch (err) {
      console.error('[PlanViewer] Plan execution stopped due to error:', err)
    } finally {
      setIsExecuting(false)
      setCurrentTodoId(null)
      inProgressTodosRef.current = new Map()
    }
  }, [plan, updateTodoStatus, persistTodoCompletion])

  // Delegate selected todos - runs them in parallel across assigned agent tabs
  // Each agent runs its assigned todos sequentially, but multiple agents work in parallel
  const delegateSelected = useCallback(async () => {
    if (!plan || selectedTodos.size === 0) return

    // Switch to agent mode (not plan mode) when running tasks
    window.dispatchEvent(new CustomEvent('assistant-switch-to-agent-mode'))

    setIsExecuting(true)
    abortControllerRef.current = new AbortController()

    // Track in-progress todos per agent for cancellation
    inProgressTodosRef.current = new Map()

    const todosToDelegate = plan.todos.filter(t => selectedTodos.has(t.id))

    // Check if we have any agent assignments in the selected todos
    const assignedLabels = getAssignedAgentLabels(todosToDelegate)
    const hasAgentAssignments = assignedLabels.length > 0

    // If we have agent assignments, send briefings and init their todo stores
    if (hasAgentAssignments) {
      sendAllAgentBriefings(plan.title, plan.overview, plan.todos)
      // Init todo stores for assigned agents with only selected todos context
      assignedLabels.forEach(label => {
        const agent = getAgentByLabel(label)
        if (agent) {
          initAgentTodoStore(agent, todosToDelegate, null)
        }
      })
    }

    try {
      const result = await executeParallel(
        {
          plan,
          selectedTodos,
          onStatusChange: (todoId, status) => {
            updateTodoStatus(todoId, status)
            
            // Track which todo is in-progress for each agent
            if (status === 'in_progress') {
              const todo = plan.todos.find(t => t.id === todoId)
              if (todo) {
                const agentLabel = todo.assigneeLabel || 'unassigned'
                const agents = getAvailableAgents()
                const agent = agents.find(a => a.label.toLowerCase() === agentLabel.toLowerCase()) || agents[0]
                if (agent) {
                  inProgressTodosRef.current.set(agent.id, todoId)
                }
              }
              setCurrentTodoId(todoId)
            } else if (status === 'completed' || status === 'failed') {
              // Clear from in-progress tracking
              for (const [agentId, tid] of inProgressTodosRef.current.entries()) {
                if (tid === todoId) {
                  inProgressTodosRef.current.set(agentId, null)
                  break
                }
              }
            }
            
            // Persist completion
            if (status === 'completed') {
              setPlan(currentPlan => {
                if (currentPlan) {
                  const updatedPlan = {
                    ...currentPlan,
                    todos: currentPlan.todos.map(t => 
                      t.id === todoId ? { ...t, status: "completed" as const } : t
                    ),
                  }
                  persistTodoCompletion(todoId, updatedPlan)
                }
                return currentPlan
              })
              
              // Send progress update
              if (hasAgentAssignments) {
                sendProgressUpdateToAgents(plan.title, plan.todos, todoId, undefined)
              }
            } else if (status === 'failed') {
              if (hasAgentAssignments) {
                sendProgressUpdateToAgents(plan.title, plan.todos, undefined, todoId)
              }
            }
          },
          onProgressChange: (progress) => {
            setExecutionProgress(progress)
            setActiveAgentLabels(progress.activeAgents)
          },
          onComplete: () => {
            setExecutionProgress(null)
            setActiveAgentLabels(new Set())
          },
        },
        abortControllerRef.current
      )
      
      // Update plan status based on results
      if (result.failedCount === 0 && result.completedCount > 0) {
        const allCompleted = plan.todos.every(t => t.status === 'completed')
        if (allCompleted) {
          setPlan(prev => prev ? { ...prev, status: "completed" } : prev)
        }
      }
    } catch (err) {
      console.error('[PlanViewer] Parallel execution failed:', err)
    } finally {
      setIsExecuting(false)
      setSelectedTodos(new Set())
      setCurrentTodoId(null)
      inProgressTodosRef.current = new Map()
    }
  }, [plan, selectedTodos, updateTodoStatus, persistTodoCompletion])

  // Stop execution - cancels all in-flight tasks across all agents
  const stopExecution = useCallback(() => {
    // Abort the controller (signals all parallel execution to stop)
    abortControllerRef.current?.abort()
    
    // Cancel tasks on all agents that have in-progress todos
    const agents = getAvailableAgents()
    for (const agent of agents) {
      const todoId = inProgressTodosRef.current.get(agent.id)
      if (todoId) {
        // Dispatch cancel event to this specific agent
        window.dispatchEvent(new CustomEvent('assistant-plan-task-cancel', {
          detail: { taskId: todoId, targetTabId: agent.id }
        }))
        
        // Mark the todo as failed
        updateTodoStatus(todoId, "failed")
        
        // Clear active todo for this agent
        dispatchActiveTodoChange(agent.threadId, null)
      }
    }
    
    // Also handle the legacy single-agent case
    if (currentTodoId && !inProgressTodosRef.current.size) {
      updateTodoStatus(currentTodoId, "failed")
      
      // Bridge: clear active todo on stop
      const threadId = getActiveThreadId()
      if (threadId) {
        dispatchActiveTodoChange(threadId, null)
      }
      
      // Dispatch event to cancel the current task in the active assistant
      window.dispatchEvent(new CustomEvent('assistant-plan-task-cancel', {
        detail: { taskId: currentTodoId }
      }))
    }
    
    // Immediately update UI state
    setIsExecuting(false)
    setCurrentTodoId(null)
    setSelectedTodos(new Set())
    setExecutionProgress(null)
    setActiveAgentLabels(new Set())
    inProgressTodosRef.current = new Map()
  }, [currentTodoId, updateTodoStatus])

  // Get status icon for todo
  const getStatusIcon = (status: PlanTodo["status"], isCurrentlyExecuting: boolean) => {
    if (isCurrentlyExecuting) {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    }
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="flex h-full items-center justify-center">
        <Typography variant="muted">{error || "Failed to load plan"}</Typography>
      </div>
    )
  }

  const completedCount = plan.todos.filter(t => t.status === "completed").length
  const progressPercent = plan.todos.length > 0 
    ? Math.round((completedCount / plan.todos.length) * 100) 
    : 0
  const isBuilt = plan.todos.length > 0 && plan.todos.every(t => t.status === "completed")
  
  // Agent-related stats
  const assignedAgentLabels = new Set(plan.todos.map(t => t.assigneeLabel).filter(Boolean))
  const workingAgentCount = plan.todos.filter(t => t.status === "in_progress" && t.assigneeLabel).length

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-end px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            onClick={handleSave}
            disabled={saving || isExecuting}
            variant="outline"
            
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button
            size="xs"
            onClick={isExecuting ? stopExecution : isBuilt ? undefined : executeSequential}
            disabled={isBuilt}
            variant={isExecuting ? "destructive" : isBuilt ? "outline" : "default"}
          >
            {isExecuting ? (
              <>
                <StopCircle className="h-3 w-3 mr-2" />
                Stop
              </>
            ) : isBuilt ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" />
                Built
              </>
            ) : (
              "Run Plan"
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-[200px]">
        <PlanTiptapEditor
          initialContent={editMarkdown}
          onContentChange={setEditMarkdown}
          placeholder="Edit plan markdown..."
        />
      </div>


      {/* Todos Panel */}
      {plan.todos.length > 0 && (
        <div className="shrink-0 border-t border-zinc-200 dark:border-white/[0.06]">
          <div className="flex w-full items-center gap-2 px-4 py-2">
            <button
              onClick={() => setTodosExpanded(!todosExpanded)}
              className="flex flex-1 items-center gap-2 hover:bg-muted/50 transition-colors rounded px-2 py-1 -mx-2"
            >
              {todosExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <Typography variant="small" className="font-medium">
                Todos ({completedCount}/{plan.todos.length})
              </Typography>
            </button>
            <Button
              size="xs"
              onClick={handleAddAgent}
              variant="default"
              title="Add a new agent (AI tab)"
            >
              <UserPlus className="h-3 w-3 mr-2" />
              Add Agent
            </Button>
          </div>
          {todosExpanded && (
            <div className={cn(styles.darkScrollbar, "max-h-[250px] overflow-y-auto px-4 pb-3")}>
              <div className="space-y-1">
                {plan.todos.map((todo) => {
                  const isCurrentlyExecuting = currentTodoId === todo.id
                  const isSelected = selectedTodos.has(todo.id)
                  
                  return (
                    <div
                      key={todo.id}
                      className="flex flex-nowrap items-center gap-3 rounded px-3 py-2 transition-colors"
                    >
                      {/* Status icon */}
                      <div className="shrink-0">
                        {isCurrentlyExecuting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : todo.status === "completed" ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : todo.status === "failed" ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : todo.status === "in_progress" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <Typography 
                          variant="small" 
                          className={cn(
                            "truncate block",
                            todo.status === "completed" && "line-through text-muted-foreground"
                          )}
                        >
                          {todo.description}
                        </Typography>
                      </div>
                      
                      {/* Dependencies badge */}
                      {todo.depends && todo.depends.length > 0 && (
                        <Typography variant="xs" className="text-muted-foreground shrink-0">
                          depends: {todo.depends.join(", ")}
                        </Typography>
                      )}
                      
                      {/* Agent Assignee Selector */}
                      <div className="shrink-0">
                        {availableAgents.length > 0 && (() => {
                          const effectiveAssignee = todo.assigneeLabel || availableAgents[0].label
                          return (
                            <Select
                              value={effectiveAssignee}
                              onValueChange={(value) => {
                                updateTodoAssignee(todo.id, value)
                              }}
                            >
                              <SelectTrigger 
                                size="xs" 
                                className="h-6 min-w-[90px] max-w-[120px] text-xs"
                              >
                                <SelectValue>
                                  <span className="truncate">{formatAgentLabel(effectiveAssignee)}</span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent align="end">
                                {availableAgents.map((agent) => (
                                  <SelectItem key={agent.tabId} value={agent.label}>
                                    {formatAgentLabel(agent.label)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      {isExecuting && (
        <div className="border-t border-zinc-200 dark:border-white/[0.06] bg-card p-3">
          <div className="flex items-center gap-2">
            <Typography variant="xs" className="text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              {executionProgress ? (
                <span>
                  {executionProgress.activeAgents.size > 1 
                    ? `${executionProgress.activeAgents.size} agents working in parallel`
                    : "Executing..."
                  }
                  {" "}({executionProgress.completedCount}/{executionProgress.totalTodos} done)
                </span>
              ) : (
                "Executing..."
              )}
            </Typography>
            <Button
              variant="destructive"
              size="xs"
              onClick={stopExecution}
            >
              <StopCircle className="h-3 w-3 mr-1" />
              Stop All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
