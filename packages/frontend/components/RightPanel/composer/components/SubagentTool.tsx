import React, { useState, useEffect, useMemo } from "react"
import { cn } from "../../../../lib/utils"
import { SubagentStreamCard } from "./SubagentStreamCard"

interface SubagentState {
  id: string
  role: string
  goal: string
  status: "pending" | "running" | "completed" | "failed" | "timeout"
  error?: string
  durationMs?: number
  toolsUsed?: string[]
  contentParts: Array<{
    type: "text" | "tool-call"
    text?: string
    toolCallId?: string
    toolName?: string
    args?: any
    argsText?: string
    result?: any
  }>
}

interface SpawnState {
  isSpawning: boolean
  totalCount: number
  roles: string[]
  subagents: Map<string, SubagentState>
  completedCount: number
  failedCount: number
  totalDurationMs?: number
}

interface SubagentToolProps {
  args: {
    subagents?: Array<{
      id: string
      role: string
      goal: string
      context?: string
    }>
    options?: {
      maxConcurrency?: number
      timeoutMs?: number
      recursionLimit?: number
    }
  }
  result?: string
}

// Role icons
const RoleIcons: Record<string, React.ReactNode> = {
  researcher: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  codebase: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </svg>
  ),
  planner: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  coder: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  reviewer: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
}

const StatusIcon = ({ status }: { status: SubagentState["status"] }) => {
  switch (status) {
    case "running":
      return (
        <svg className="w-3.5 h-3.5 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      )
    case "completed":
      return (
        <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )
    case "failed":
    case "timeout":
      return (
        <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    default:
      return (
        <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}

const RoleBadge = ({ role }: { role: string }) => {
  const colorClasses: Record<string, string> = {
    researcher: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    codebase: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    planner: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    coder: "bg-green-500/10 text-green-600 border-green-500/20",
    reviewer: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded border",
      colorClasses[role] || "bg-muted text-muted-foreground border-border"
    )}>
      {RoleIcons[role] || null}
      {role}
    </span>
  )
}

export function SubagentTool({ args, result }: SubagentToolProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [spawnState, setSpawnState] = useState<SpawnState>({
    isSpawning: true,
    totalCount: args?.subagents?.length || 0,
    roles: args?.subagents?.map(s => s.role) || [],
    subagents: new Map(),
    completedCount: 0,
    failedCount: 0,
  })

  // Parse result if available
  const parsedResult = useMemo(() => {
    if (!result) return null
    try {
      return JSON.parse(result)
    } catch {
      return null
    }
  }, [result])

  // Initialize subagent states from args
  useEffect(() => {
    if (!args?.subagents) return

    const subagents = new Map<string, SubagentState>()
    args.subagents.forEach(s => {
      subagents.set(s.id, {
        id: s.id,
        role: s.role,
        goal: s.goal,
        status: "pending",
      })
    })

    setSpawnState(prev => ({
      ...prev,
      subagents,
    }))
  }, [args?.subagents])

  // Update from parsed result
  useEffect(() => {
    if (!parsedResult?.results) return

    const subagents = new Map<string, SubagentState>()
    parsedResult.results.forEach((r: any) => {
      subagents.set(r.id, {
        id: r.id,
        role: r.role,
        goal: args?.subagents?.find(s => s.id === r.id)?.goal || "",
        status: r.status,
        error: r.error,
        durationMs: r.durationMs,
        toolsUsed: r.toolsUsed,
      })
    })

    setSpawnState(prev => ({
      ...prev,
      isSpawning: false,
      subagents,
      completedCount: parsedResult.completedCount || 0,
      failedCount: parsedResult.failedCount || 0,
      totalDurationMs: parsedResult.totalDurationMs,
    }))
  }, [parsedResult, args?.subagents])

  // Listen for subagent events
  useEffect(() => {
    function handleSubagentEvent(e: CustomEvent) {
      const evt = e.detail

      switch (evt.type) {
        case "subagent-spawn-start":
          setSpawnState(prev => ({
            ...prev,
            isSpawning: true,
            totalCount: evt.subagentCount,
            roles: evt.roles,
          }))
          break

        case "subagent-start":
          setSpawnState(prev => {
            const newSubagents = new Map(prev.subagents)
            newSubagents.set(evt.subagentId, {
              id: evt.subagentId,
              role: evt.role,
              goal: evt.goal,
              status: "running",
              contentParts: [],
            })
            return { ...prev, subagents: newSubagents }
          })
          break

        case "subagent-content":
          setSpawnState(prev => {
            const newSubagents = new Map(prev.subagents)
            const subagent = newSubagents.get(evt.subagentId)
            if (subagent) {
              const parts = [...(subagent.contentParts || [])]
              const lastPart = parts[parts.length - 1]
              if (lastPart && lastPart.type === "text") {
                parts[parts.length - 1] = {
                  ...lastPart,
                  text: (lastPart.text || "") + evt.text,
                }
              } else {
                parts.push({ type: "text", text: evt.text })
              }
              newSubagents.set(evt.subagentId, { ...subagent, contentParts: parts })
            }
            return { ...prev, subagents: newSubagents }
          })
          break

        case "subagent-tool-call-start":
          setSpawnState(prev => {
            const newSubagents = new Map(prev.subagents)
            const subagent = newSubagents.get(evt.subagentId)
            if (subagent) {
              const parts = [...(subagent.contentParts || [])]
              parts.push({
                type: "tool-call",
                toolCallId: evt.toolCallId,
                toolName: evt.toolName,
                args: evt.args || {},
                argsText: evt.argsText,
                result: undefined,
              })
              newSubagents.set(evt.subagentId, { ...subagent, contentParts: parts })
            }
            return { ...prev, subagents: newSubagents }
          })
          break

        case "subagent-tool-result":
          setSpawnState(prev => {
            const newSubagents = new Map(prev.subagents)
            const subagent = newSubagents.get(evt.subagentId)
            if (subagent) {
              const parts = [...(subagent.contentParts || [])]
              const toolCallIndex = parts.findIndex(
                p => p.type === "tool-call" && p.toolCallId === evt.toolCallId
              )
              if (toolCallIndex !== -1) {
                parts[toolCallIndex] = {
                  ...parts[toolCallIndex],
                  result: evt.result,
                }
                newSubagents.set(evt.subagentId, { ...subagent, contentParts: parts })
              }
            }
            return { ...prev, subagents: newSubagents }
          })
          break

        case "subagent-end":
          setSpawnState(prev => {
            const newSubagents = new Map(prev.subagents)
            const existing = newSubagents.get(evt.subagentId)
            if (existing) {
              newSubagents.set(evt.subagentId, {
                ...existing,
                status: evt.status,
                error: evt.error,
                durationMs: evt.durationMs,
              })
            }
            return { ...prev, subagents: newSubagents }
          })
          break

        case "subagent-spawn-complete":
          setSpawnState(prev => ({
            ...prev,
            isSpawning: false,
            completedCount: evt.completedCount,
            failedCount: evt.failedCount,
            totalDurationMs: evt.totalDurationMs,
          }))
          break
      }
    }

    window.addEventListener("assistant-subagent-event", handleSubagentEvent as EventListener)
    return () => {
      window.removeEventListener("assistant-subagent-event", handleSubagentEvent as EventListener)
    }
  }, [])

  const subagentList = Array.from(spawnState.subagents.values())
  const isRunning = spawnState.isSpawning && !parsedResult

  return (
    <div className="mb-3 w-full rounded-lg bg-card/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 py-1 text-left hover:bg-muted/30 transition-colors"
      >

        <div className="ml-auto flex items-center gap-2">
          {isRunning ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
              Running {subagentList.filter(s => s.status === "running").length}/{spawnState.totalCount}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {spawnState.completedCount}/{spawnState.totalCount} completed
              {spawnState.totalDurationMs && ` • ${(spawnState.totalDurationMs / 1000).toFixed(1)}s`}
            </span>
          )}
          <svg
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Subagent list */}
      {isExpanded && (
        <div>
          {/* Debug info */}
          {subagentList.length === 0 && !args?.subagents && (
            <div className="text-xs text-muted-foreground">No subagents found in args</div>
          )}

          {/* Show initial pending subagents if Map is empty */}
          {subagentList.length === 0 && args?.subagents && args.subagents.length > 0 && args.subagents.map(s => (
            <SubagentStreamCard
              key={s.id}
              subagentId={s.id}
              role={s.role}
              goal={s.goal}
              status="running"
              contentParts={[]}
            />
          ))}

          {/* Show subagents from state once events start arriving */}
          {subagentList.map(subagent => (
            <SubagentStreamCard
              key={subagent.id}
              subagentId={subagent.id}
              role={subagent.role}
              goal={subagent.goal}
              status={subagent.status}
              contentParts={subagent.contentParts}
              error={subagent.error}
              durationMs={subagent.durationMs}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SubagentCard({ subagent }: { subagent: SubagentState }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className={cn(
      "rounded-md border px-3 py-2 transition-colors",
      subagent.status === "running" && "border-blue-500/30 bg-blue-500/5",
      subagent.status === "completed" && "border-green-500/20 bg-green-500/5",
      (subagent.status === "failed" || subagent.status === "timeout") && "border-red-500/20 bg-red-500/5",
      subagent.status === "pending" && "border-border/50 bg-muted/20"
    )}>
      <div className="flex items-start gap-2">
        <StatusIcon status={subagent.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <RoleBadge role={subagent.role} />
            <span className="text-xs text-muted-foreground truncate">
              {subagent.id}
            </span>
            {subagent.durationMs && (
              <span className="text-xs text-muted-foreground">
                {(subagent.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/80 mt-1 line-clamp-1">
            {subagent.goal}
          </p>
          {subagent.error && (
            <p className="text-xs text-red-500 mt-1">
              {subagent.error}
            </p>
          )}
          {subagent.toolsUsed && subagent.toolsUsed.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-muted-foreground mt-1 hover:text-foreground"
            >
              {showDetails ? "Hide" : "Show"} tools used ({subagent.toolsUsed.length})
            </button>
          )}
          {showDetails && subagent.toolsUsed && (
            <div className="mt-1 flex flex-wrap gap-1">
              {subagent.toolsUsed.map(tool => (
                <span key={tool} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubagentTool
