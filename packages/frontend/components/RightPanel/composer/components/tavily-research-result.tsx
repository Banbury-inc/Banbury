import { useMemo } from "react"
import ToolCallCard from "./ToolCallCard"
import type { ReactNode, SVGProps } from "react"
import { Button } from "frontend/components/ui/button"

interface Source {
  url: string
  title?: string
  snippet?: string
}

interface ResearchResponse {
  success: boolean
  status: "pending" | "completed" | "failed"
  request_id: string
  input?: string
  model?: string
  report?: string
  sources?: Source[]
  created_at?: string
  completed_at?: string
  response_time?: number
  usage?: { credits: number }
  message?: string
  error?: string
  details?: string
}

const ResearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </svg>
)

const ExternalLinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const CheckCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const AlertIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

interface ToolCallProps {
  toolName: string
  toolCallId?: string
  argsText: string
  args?: any
  result?: unknown
}

export const TavilyResearchTool = ({ toolName, toolCallId, argsText, args, result }: ToolCallProps) => {
  const parsedArgs = useMemo(() => {
    if (args) return args
    try {
      return JSON.parse(argsText || "{}")
    } catch {
      return {}
    }
  }, [args, argsText])

  // Handle both web_research and web_get_research
  if (toolName !== "web_research" && toolName !== "web_get_research") return null

  const renderOutput = (value: unknown): ReactNode => {
    let parsed: ResearchResponse | null = null
    try {
      if (typeof value === "string") parsed = JSON.parse(value)
      else parsed = value as ResearchResponse
    } catch {
      parsed = null
    }

    // Error state
    if (parsed && !parsed.success) {
      return (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertIcon className="size-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">{parsed.error || "Research failed"}</div>
            {parsed.details && <div className="text-xs mt-0.5">{parsed.details}</div>}
          </div>
        </div>
      )
    }

    // Loading state
    if (!parsed) {
      return (
        <div className="text-sm text-muted-foreground">{result ? "No results found." : "Processing..."}</div>
      )
    }

    // Pending state
    if (parsed.status === "pending") {
      return (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
            <ClockIcon className="size-4 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="font-medium">Research in progress...</div>
              {parsed.message && <div className="text-xs mt-0.5 text-foreground/70">{parsed.message}</div>}
            </div>
          </div>
          {parsed.request_id && (
            <div className="text-xs text-muted-foreground bg-zinc-100 dark:bg-zinc-800 p-2 rounded font-mono">
              Request ID: {parsed.request_id}
            </div>
          )}
        </div>
      )
    }

    // Completed state
    if (parsed.status === "completed" && parsed.report) {
      return (
        <div className="space-y-3">
          {/* Success header */}
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircleIcon className="size-4 shrink-0" />
            <span className="font-medium">Research completed</span>
            {parsed.model && <span className="text-xs text-muted-foreground">({parsed.model})</span>}
          </div>

          {/* Research report */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-sm text-foreground/90 whitespace-pre-wrap">{parsed.report}</div>
          </div>

          {/* Sources */}
          {parsed.sources && parsed.sources.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-foreground">Sources ({parsed.sources.length})</div>
              <div className="space-y-1">
                {parsed.sources.map((source, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="shrink-0 text-muted-foreground font-mono">[{index + 1}]</span>
                    <div className="flex-1 min-w-0">
                      {source.title && <div className="font-medium line-clamp-1">{source.title}</div>}
                      {source.snippet && <div className="text-muted-foreground line-clamp-2 mt-0.5">{source.snippet}</div>}
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate inline-block max-w-full mt-0.5"
                      >
                        {source.url}
                      </a>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-6 w-6 p-0"
                      asChild
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open in new tab"
                      >
                        <ExternalLinkIcon className="size-2.5" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer with stats */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            {parsed.response_time && <span>Completed in {parsed.response_time.toFixed(1)}s</span>}
            {parsed.usage && <span>{parsed.usage.credits} credit{parsed.usage.credits !== 1 ? "s" : ""} used</span>}
          </div>
        </div>
      )
    }

    // Initiated state (for web_research)
    if (parsed.request_id && !parsed.report) {
      return (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
            <ClockIcon className="size-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Research task initiated</div>
              {parsed.message && <div className="text-xs mt-0.5 text-foreground/70">{parsed.message}</div>}
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-zinc-100 dark:bg-zinc-800 p-2 rounded font-mono">
            Request ID: {parsed.request_id}
          </div>
        </div>
      )
    }

    return (
      <div className="text-sm text-muted-foreground">No results available</div>
    )
  }

  // Create label based on tool type and args
  let label = ""
  if (toolName === "web_research") {
    label = `Researching: ${parsedArgs.input || "Unknown topic"}`
  } else if (toolName === "web_get_research") {
    label = `Retrieving research results`
  }

  return (
    <ToolCallCard
      toolName={toolName}
      label={label}
      argsText={argsText}
      result={result}
      icon={<ResearchIcon className="h-4 w-4" />}
      renderOutput={renderOutput}
    />
  )
}
