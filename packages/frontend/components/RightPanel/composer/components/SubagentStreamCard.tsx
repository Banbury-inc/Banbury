import React, { useState, useEffect, useRef } from "react"
import { cn } from "../../../../lib/utils"
import { Button } from "../../../common/ui/button"
import ReactMarkdown from "react-markdown"
import { ToolUI } from "../../ToolUI"
import styles from "../../../../styles/scrollbar.module.css"

interface SubagentStreamCardProps {
  subagentId: string
  role: string
  goal: string
  status: "running" | "completed" | "failed" | "timeout"
  contentParts: Array<{ 
    type: "text" | "tool-call"
    text?: string
    toolCallId?: string
    toolName?: string
    args?: any
    argsText?: string
    result?: any
  }>
  error?: string
  durationMs?: number
}

const RoleConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  researcher: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    label: "Researcher",
  },
  codebase: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      </svg>
    ),
    label: "Codebase",
  },
  planner: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
    label: "Planner",
  },
  coder: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    label: "Coder",
  },
  reviewer: {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    label: "Reviewer",
  },
}

const Loader2 = () => (
  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

const Check = () => (
  <svg className="h-3 w-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const XCircle = () => (
  <svg className="h-3 w-3 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const ChevronDown = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronUp = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

export function SubagentStreamCard({
  subagentId,
  role,
  goal,
  status,
  contentParts = [],
  error,
  durationMs,
}: SubagentStreamCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const config = RoleConfig[role] || {
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    label: role.charAt(0).toUpperCase() + role.slice(1),
  }

  const isRunning = status === "running"
  const isFailed = status === "failed" || status === "timeout"

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (contentRef.current && !isCollapsed) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [contentParts, isCollapsed])

  return (
    <div className="mb-2 w-full">
      <div className="flex items-center gap-2 text-xs text-jited-foreground">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-zinc-500">{config.icon}</span>
          <span className="font-medium text-foreground/90">{config.label}</span>
          {goal && <span className="text-muted-foreground truncate">- {goal}</span>}
        </div>
        <div className="ml-1 flex items-center gap-1">
          {isRunning ? (
            <Loader2 />
          ) : isFailed ? (
            <XCircle />
          ) : (
            <Check />
          )}
          {durationMs && (
            <span className="text-muted-foreground">
              {(durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronDown /> : <ChevronUp />}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="pl-8 pr-1">
          {/* Error */}
          {error && (
            <div className="mb-2 text-xs text-red-600">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {/* Render content parts (text and tool calls) with scrolling */}
          {contentParts.length > 0 ? (
            <div className="relative">
              <div 
                ref={contentRef}
                className={cn("scroll-smooth pr-2", styles.darkScrollbar)}
                style={{ 
                  maxHeight: 'calc(5 * 1.55 * 0.875rem)', // 5 lines: line-height * font-size * 5
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 0.75rem, black calc(100% - 0.75rem), transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 0.75rem, black calc(100% - 0.75rem), transparent 100%)',
                }}
              >
                {contentParts.map((part, idx) => {
                  if (part.type === "text" && part.text) {
                    return (
                      <div key={idx} className="text-xs leading-relaxed text-muted-foreground prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                      </div>
                    )
                  } else if (part.type === "tool-call" && part.toolName) {
                    return (
                      <div key={idx}>
                        <ToolUI
                          toolName={part.toolName}
                          toolCallId={part.toolCallId}
                          args={part.args || {}}
                          argsText={part.argsText}
                          result={part.result}
                        />
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          ) : (isRunning || status === "pending") && !error ? (
            <div className="text-xs text-muted-foreground">waiting for output…</div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default SubagentStreamCard
