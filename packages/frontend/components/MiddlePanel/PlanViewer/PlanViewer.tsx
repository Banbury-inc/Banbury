import { useState, useEffect, useCallback, useRef } from "react"
import {
  Play,
  Users,
  Loader2,
  Save,
  StopCircle,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  ListTodo,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Button } from "../../ui/button"
import { Typography } from "../../ui/typography"
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

export interface PlanTodo {
  id: string
  description: string
  status: "pending" | "in_progress" | "completed" | "failed"
  depends?: string[]
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
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastFetchKeyRef = useRef<string | null>(null)

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
        const cleanDescription = description.replace(/\s*\(depends:[^)]+\)/, "").trim()

        todos.push({
          id,
          description: cleanDescription,
          status: isCompleted ? "completed" : "pending",
          depends,
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
      md += `- ${checkbox} id:${todo.id} | ${todo.description}${depends}\n`
    })
    md += `\n## Notes\n${p.notes}\n`
    return md
  }, [])

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

  // Execute a single todo via the right panel assistant
  const executeTodo = useCallback(async (
    todo: PlanTodo, 
    planContext: { planTitle: string; todos: PlanTodo[]; currentTodoId: string; isSubAgent?: boolean }
  ): Promise<boolean> => {
    if (abortControllerRef.current?.signal.aborted) {
      console.error('[PlanViewer] Execution aborted for:', todo.description)
      updateTodoStatus(todo.id, "failed")
      return false
    }

    // Check if there's an active AI tab in the right panel
    const activeAiTabId = (window as any).__banburyActiveAiTabId
    if (!activeAiTabId) {
      // Dispatch event to open the AI panel
      window.dispatchEvent(new CustomEvent('open-ai-panel'))
      // Wait a moment for the panel to open
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check again
      const newActiveTabId = (window as any).__banburyActiveAiTabId
      if (!newActiveTabId) {
        console.error('[PlanViewer] No AI assistant tab available to run plan')
        updateTodoStatus(todo.id, "failed")
        return false
      }
    }

    setCurrentTodoId(todo.id)
    updateTodoStatus(todo.id, "in_progress")
    
    // Bridge: dispatch active todo change to Right Panel
    const threadIdForActive = getActiveThreadId()
    if (threadIdForActive) {
      dispatchActiveTodoChange(threadIdForActive, todo.id)
    }

    return new Promise((resolve) => {
      // Declare timeoutId first so it can be referenced in handleTaskComplete
      let timeoutId: ReturnType<typeof setTimeout>

      // Listen for task completion
      const handleTaskComplete = (event: CustomEvent) => {
        const { taskId, success } = event.detail
        
        if (taskId !== todo.id) {
          return // Not our task
        }

        window.removeEventListener('assistant-plan-task-complete', handleTaskComplete as EventListener)
        clearTimeout(timeoutId)

        if (success) {
          updateTodoStatus(todo.id, "completed")
          setCurrentTodoId(null)
          // Bridge: clear active todo
          const tid = getActiveThreadId()
          if (tid) dispatchActiveTodoChange(tid, null)
          resolve(true)
        } else {
          updateTodoStatus(todo.id, "failed")
          setCurrentTodoId(null)
          // Bridge: clear active todo
          const tid = getActiveThreadId()
          if (tid) dispatchActiveTodoChange(tid, null)
          resolve(false)
        }
      }

      window.addEventListener('assistant-plan-task-complete', handleTaskComplete as EventListener)

      // Build the task message with plan context
      const taskMessage = `## Plan Task Execution

**Plan:** ${planContext.planTitle}

**Current Task:** ${todo.description}

**Task ID:** ${todo.id}

Please execute this task completely. When finished, explain what you accomplished.`

      // Dispatch event to the right panel assistant
      window.dispatchEvent(new CustomEvent('assistant-plan-task-execute', {
        detail: {
          taskId: todo.id,
          message: taskMessage,
          planContext: {
            ...planContext,
            currentTodoId: todo.id
          }
        }
      }))

      // Timeout after 10 minutes
      timeoutId = setTimeout(() => {
        window.removeEventListener('assistant-plan-task-complete', handleTaskComplete as EventListener)
        console.error('[PlanViewer] Task timed out:', todo.description)
        updateTodoStatus(todo.id, "failed")
        setCurrentTodoId(null)
        // Bridge: clear active todo on timeout
        const tid = getActiveThreadId()
        if (tid) dispatchActiveTodoChange(tid, null)
        resolve(false)
      }, 10 * 60 * 1000)
    })
  }, [updateTodoStatus])

  // Execute plan sequentially - one task at a time via the right panel assistant
  const executeSequential = useCallback(async () => {
    if (!plan) return

    // Switch to agent mode (not plan mode) when running a plan
    window.dispatchEvent(new CustomEvent('assistant-switch-to-agent-mode'))

    setIsExecuting(true)
    abortControllerRef.current = new AbortController()

    // Bridge: Initialize todos in the Right Panel todo store
    const threadId = getActiveThreadId()
    if (threadId) {
      dispatchPlanTodosInit(threadId, plan.todos, null)
    }

    // Build structured plan context for the agent
    const planContext = {
      planTitle: plan.title,
      todos: plan.todos,
      currentTodoId: "", // Will be set per-task
      isSubAgent: false
    }

    let completedCount = 0
    let failedCount = 0

    try {
      for (let i = 0; i < plan.todos.length; i++) {
        const todo = plan.todos[i]
        
        if (todo.status === "completed") {
          completedCount++
          continue
        }
        if (abortControllerRef.current.signal.aborted) {
          break
        }
        
        // Execute task and wait for completion before next
        const success = await executeTodo(todo, planContext)
        
        if (success) {
          completedCount++
        } else {
          failedCount++
          // Continue to next task even if one fails
        }
        
        // Small delay between tasks for UI to settle
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Update plan status based on results
      if (failedCount === 0 && completedCount === plan.todos.length) {
        setPlan(prev => prev ? { ...prev, status: "completed" } : prev)
      } else if (failedCount > 0 && completedCount === 0) {
        setPlan(prev => prev ? { ...prev, status: "failed" } : prev)
      }
    } catch (err) {
      console.error('[PlanViewer] Plan execution stopped due to error:', err)
    } finally {
      setIsExecuting(false)
    }
  }, [plan, executeTodo])

  // Delegate selected todos - runs them one at a time via assistant
  // Note: For true parallel execution, we'd need multiple assistant instances
  const delegateSelected = useCallback(async () => {
    if (!plan || selectedTodos.size === 0) return

    // Switch to agent mode (not plan mode) when running tasks
    window.dispatchEvent(new CustomEvent('assistant-switch-to-agent-mode'))

    setIsExecuting(true)
    abortControllerRef.current = new AbortController()

    // Bridge: Initialize todos in the Right Panel todo store
    const threadId = getActiveThreadId()
    if (threadId) {
      dispatchPlanTodosInit(threadId, plan.todos, null)
    }

    const planContext = {
      planTitle: plan.title,
      todos: plan.todos,
      currentTodoId: "",
      isSubAgent: false
    }
    
    const todosToDelegate = plan.todos.filter(t => selectedTodos.has(t.id))

    try {
      for (const todo of todosToDelegate) {
        if (abortControllerRef.current.signal.aborted) break
        
        await executeTodo(todo, planContext)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (err) {
      console.error('[PlanViewer] Some tasks failed:', err)
    } finally {
      setIsExecuting(false)
      setSelectedTodos(new Set())
    }
  }, [plan, selectedTodos, executeTodo])

  // Stop execution
  const stopExecution = useCallback(() => {
    abortControllerRef.current?.abort()
    
    // Mark any in-progress todos as failed
    if (currentTodoId) {
      updateTodoStatus(currentTodoId, "failed")
    }
    
    // Immediately update UI state
    setIsExecuting(false)
    setCurrentTodoId(null)
    setSelectedTodos(new Set())
    
    // Bridge: clear active todo on stop
    const threadId = getActiveThreadId()
    if (threadId) {
      dispatchActiveTodoChange(threadId, null)
    }
    
    // Dispatch event to cancel the current task in the assistant
    window.dispatchEvent(new CustomEvent('assistant-plan-task-cancel', {
      detail: { taskId: currentTodoId }
    }))
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

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex-1 min-w-0">
          <Typography variant="h4" className="truncate">{plan.title}</Typography>
          <div className="flex items-center gap-2 mt-1">
            <Typography variant="xs" className="text-muted-foreground">
              {completedCount}/{plan.todos.length} tasks completed
            </Typography>
            <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <Typography variant="xs" className="text-muted-foreground">
              {progressPercent}%
            </Typography>
          </div>
        </div>
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
            onClick={isExecuting ? stopExecution : executeSequential}
            disabled={plan.todos.every(t => t.status === "completed")}
            variant={isExecuting ? "destructive" : "default"}
          >
            {isExecuting ? (
              <>
                <StopCircle className="h-3 w-3 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-2" />
                Run Plan
              </>
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
          <button
            onClick={() => setTodosExpanded(!todosExpanded)}
            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-muted/50 transition-colors"
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
          {todosExpanded && (
            <div className={cn(styles.darkScrollbar, "max-h-[250px] overflow-y-auto px-4 pb-3")}>
              <div className="space-y-1">
                {plan.todos.map((todo) => {
                  const isCurrentlyExecuting = currentTodoId === todo.id
                  const isSelected = selectedTodos.has(todo.id)
                  
                  return (
                    <div
                      key={todo.id}
                      onClick={() => !isExecuting && toggleTodoSelection(todo.id)}
                      className={cn(
                        "flex flex-nowrap items-center gap-3 rounded px-3 py-2 transition-colors",
                        isCurrentlyExecuting && "bg-blue-500/10 border border-blue-500/30",
                        isSelected && !isCurrentlyExecuting && "bg-primary/10 border border-primary/30",
                        !isCurrentlyExecuting && !isSelected && "hover:bg-muted/50 border border-transparent",
                        !isExecuting && "cursor-pointer"
                      )}
                    >
                      {/* Selection checkbox (only when not executing) */}
                      {!isExecuting && (
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                          isSelected ? "bg-primary border-primary" : "border-muted-foreground/50"
                        )}>
                          {isSelected && (
                            <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                      )}
                      
                      {/* Status icon */}
                      <div className="shrink-0">
                        {getStatusIcon(todo.status, isCurrentlyExecuting)}
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
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      {(selectedTodos.size > 0 || isExecuting) && (
        <div className="border-t border-zinc-200 dark:border-white/[0.06] bg-card p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {isExecuting && (
                <Typography variant="xs" className="text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Executing...
                </Typography>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedTodos.size > 0 && !isExecuting && (
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={delegateSelected}
                >
                  <Users className="h-3 w-3 mr-2" />
                  Delegate {selectedTodos.size} Task{selectedTodos.size > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
