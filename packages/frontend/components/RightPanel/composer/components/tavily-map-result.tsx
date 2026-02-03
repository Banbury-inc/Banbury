import { useMemo, useState } from "react"
import ToolCallCard from "./ToolCallCard"
import type { ReactNode, SVGProps } from "react"
import { Button } from "@/components/common/ui/button"

interface MapResponse {
  success: boolean
  base_url: string
  results: string[]
  total_urls: number
  response_time?: number
  usage?: { credits: number }
  error?: string
  details?: string
}

const MapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
)

const ExternalLinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const AlertIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const FolderIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

interface ToolCallProps {
  toolName: string
  toolCallId?: string
  argsText: string
  args?: any
  result?: unknown
}

export const TavilyMapTool = ({ toolName, toolCallId, argsText, args, result }: ToolCallProps) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const parsedArgs = useMemo(() => {
    if (args) return args
    try {
      return JSON.parse(argsText || "{}")
    } catch {
      return { url: "Unknown URL" }
    }
  }, [args, argsText])

  // Parse result to extract URLs for grouping
  const parsedResult = useMemo(() => {
    let parsed: MapResponse | null = null
    try {
      if (typeof result === "string") parsed = JSON.parse(result)
      else parsed = result as MapResponse
    } catch {
      parsed = null
    }
    return parsed
  }, [result])

  // Group URLs by path segments for hierarchical display
  const groupedUrls = useMemo(() => {
    const groups: Record<string, string[]> = {}
    
    if (!parsedResult?.results) return groups

    parsedResult.results.forEach(url => {
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        const groupKey = pathParts[0] || 'root'

        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(url)
      } catch {
        if (!groups['other']) {
          groups['other'] = []
        }
        groups['other'].push(url)
      }
    })

    return groups
  }, [parsedResult])

  if (toolName !== "web_map") return null

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  const renderOutput = (value: unknown): ReactNode => {
    let parsed: MapResponse | null = null
    try {
      if (typeof value === "string") parsed = JSON.parse(value)
      else parsed = value as MapResponse
    } catch {
      parsed = null
    }

    // Error state
    if (parsed && !parsed.success) {
      return (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertIcon className="size-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">{parsed.error || "Map operation failed"}</div>
            {parsed.details && <div className="text-xs mt-0.5">{parsed.details}</div>}
          </div>
        </div>
      )
    }

    // Loading state
    if (!parsed?.results) {
      return (
        <div className="text-sm text-muted-foreground">{result ? "No URLs found." : "Mapping website..."}</div>
      )
    }

    const { base_url, results, total_urls, usage } = parsed

    const groupNames = Object.keys(groupedUrls).sort()

    return (
      <div className="space-y-3">
        {/* Base URL header */}
        <div className="text-xs text-muted-foreground">
          Site map for: <span className="font-medium">{base_url}</span>
        </div>

        {/* Grouped URLs */}
        {groupNames.length > 0 && (
          <div className="space-y-2">
            {groupNames.map((groupName, groupIndex) => {
              const isCollapsed = collapsedGroups.has(groupName)
              const groupUrls = groupedUrls[groupName]

              return (
                <div key={groupIndex} className="space-y-1">
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-foreground/80 transition-colors w-full"
                  >
                    <FolderIcon className="size-3 shrink-0" />
                    <span className="truncate">/{groupName}</span>
                    <span className="text-muted-foreground">({groupUrls.length})</span>
                    <svg
                      className={`size-3 ml-auto transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Group URLs */}
                  {!isCollapsed && (
                    <div className="ml-4 space-y-1">
                      {groupUrls.map((url, urlIndex) => {
                        const isExternal = !url.includes(base_url)

                        return (
                          <div
                            key={urlIndex}
                            className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            {isExternal && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium shrink-0">
                                EXT
                              </span>
                            )}
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate flex-1"
                            >
                              {url}
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="shrink-0 h-5 w-5 p-0"
                              asChild
                            >
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open in new tab"
                              >
                                <ExternalLinkIcon className="size-2" />
                              </a>
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer with stats */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{total_urls} URL{total_urls !== 1 ? "s" : ""} discovered</span>
          {usage && <span>{usage.credits} credit{usage.credits !== 1 ? "s" : ""} used</span>}
        </div>
      </div>
    )
  }

  const label = `Mapping website: ${parsedArgs.url}`

  return (
    <ToolCallCard
      toolName="web_map"
      label={label}
      argsText={argsText}
      result={result}
      icon={<MapIcon className="h-4 w-4" />}
      renderOutput={renderOutput}
    />
  )
}
