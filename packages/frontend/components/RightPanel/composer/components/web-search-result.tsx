import { useEffect, useRef, useState, useMemo } from "react"
import ToolCallCard from "./ToolCallCard"
import { ParallelWebSearchGroup } from "./ParallelWebSearchGroup"
import type { ReactNode, SVGProps } from "react"
import { Button } from "frontend/components/ui/button"

interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

interface WebSearchResponse {
  results: WebSearchResult[]
  query: string
}

const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const ExternalLinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

// Global tracker for parallel web searches within a short time window
interface TrackedSearch {
  toolCallId: string
  args: any
  result?: unknown
  timestamp: number
}

// Singleton tracker for parallel web searches
const parallelSearchTracker = {
  searches: new Map<string, TrackedSearch>(),
  primaryId: null as string | null,
  listeners: new Set<() => void>(),
  lastGroupTimestamp: 0,
  
  register(id: string, args: any, result?: unknown) {
    const now = Date.now()
    
    // If it's been more than 10 seconds since the last search group, start fresh
    if (now - this.lastGroupTimestamp > 10000 && this.searches.size > 0) {
      // Check if all existing searches are complete
      const allComplete = Array.from(this.searches.values()).every(s => s.result !== undefined)
      if (allComplete) {
        this.searches.clear()
        this.primaryId = null
      }
    }
    
    // Clean up old searches (older than 60 seconds with results)
    for (const [key, search] of this.searches.entries()) {
      if (search.result !== undefined && now - search.timestamp > 60000) {
        this.searches.delete(key)
      }
    }
    
    // Check if this is a new group (first search after cleanup or no pending searches)
    const hasPendingSearches = Array.from(this.searches.values()).some(
      s => s.result === undefined
    )
    
    if (!hasPendingSearches && this.searches.size === 0) {
      this.primaryId = id
      this.lastGroupTimestamp = now
    } else if (this.primaryId === null) {
      this.primaryId = id
      this.lastGroupTimestamp = now
    }
    
    this.searches.set(id, {
      toolCallId: id,
      args,
      result,
      timestamp: now
    })
    
    this.notify()
  },
  
  updateResult(id: string, result: unknown) {
    const search = this.searches.get(id)
    if (search) {
      search.result = result
      this.notify()
    }
  },
  
  isPrimary(id: string): boolean {
    return this.primaryId === id
  },
  
  getParallelSearches(): TrackedSearch[] {
    const now = Date.now()
    // Get all searches registered within the same session (within 60 seconds of each other)
    const searches = Array.from(this.searches.values())
    if (searches.length === 0) return []
    
    // Find the most recent group based on timestamp proximity
    const sorted = searches.sort((a, b) => a.timestamp - b.timestamp)
    const recentSearches: TrackedSearch[] = []
    
    for (const search of sorted) {
      // Include if it's within 5 seconds of the group start or still pending
      if (now - search.timestamp < 60000) {
        recentSearches.push(search)
      }
    }
    
    return recentSearches
  },
  
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  },
  
  notify() {
    this.listeners.forEach(l => l())
  },
  
  clear() {
    this.searches.clear()
    this.primaryId = null
    this.lastGroupTimestamp = 0
    this.notify()
  }
}

// Hook to use the parallel search tracker
function useParallelSearchTracker(id: string, args: any, result?: unknown) {
  const [, forceUpdate] = useState({})
  const registeredRef = useRef(false)
  
  // Register this search on mount
  useEffect(() => {
    if (!registeredRef.current) {
      parallelSearchTracker.register(id, args, result)
      registeredRef.current = true
    }
  }, [id, args, result])
  
  // Update result when it changes
  useEffect(() => {
    if (result !== undefined) {
      parallelSearchTracker.updateResult(id, result)
    }
  }, [id, result])
  
  // Subscribe to updates
  useEffect(() => {
    return parallelSearchTracker.subscribe(() => forceUpdate({}))
  }, [])
  
  // Listen for conversation clear events to reset tracker
  useEffect(() => {
    const handleClear = () => {
      parallelSearchTracker.clear()
    }
    window.addEventListener('clear-conversation', handleClear)
    return () => window.removeEventListener('clear-conversation', handleClear)
  }, [])
  
  return {
    isPrimary: parallelSearchTracker.isPrimary(id),
    parallelSearches: parallelSearchTracker.getParallelSearches(),
    hasMultiple: parallelSearchTracker.getParallelSearches().length > 1
  }
}

// Props passed by @assistant-ui/react's ToolCallMessagePartComponent
// Plus additional props we may receive from ToolUI
interface ToolCallProps {
  toolName: string
  toolCallId?: string
  argsText: string
  args?: any
  result?: unknown
}

// Track component mount order to generate stable IDs
let webSearchMountCounter = 0

export const WebSearchTool = ({ toolName, toolCallId, argsText, args, result }: ToolCallProps) => {
  if (toolName !== "web_search") return null
  
  // Parse args if only argsText is provided
  const parsedArgs = useMemo(() => {
    if (args) return args
    try {
      return JSON.parse(argsText || "{}")
    } catch {
      return { query: "Unknown query" }
    }
  }, [args, argsText])
  
  // Generate a stable ID for this search component using query content for uniqueness
  const stableIdRef = useRef<string | null>(null)
  if (!stableIdRef.current) {
    const querySlug = (parsedArgs.query || "unknown").slice(0, 30).replace(/\s+/g, '-')
    stableIdRef.current = toolCallId || `search-${webSearchMountCounter++}-${querySlug}`
  }
  const id = stableIdRef.current
  
  const { isPrimary, parallelSearches, hasMultiple } = useParallelSearchTracker(id, parsedArgs, result)
  
  // If this is a parallel search group and this is the primary search, render the group
  if (hasMultiple && isPrimary) {
    const searches = parallelSearches.map(s => ({
      toolCallId: s.toolCallId,
      toolName: "web_search",
      args: s.args,
      result: s.result
    }))
    
    return <ParallelWebSearchGroup searches={searches} />
  }
  
  // If this is part of a parallel group but not primary, don't render
  // The primary will render the grouped view
  if (hasMultiple && !isPrimary) {
    return null
  }
  
  // Single search - render normally
  const renderOutput = (value: unknown): ReactNode => {
    let parsed: WebSearchResponse | null = null
    try {
      if (typeof value === "string") parsed = JSON.parse(value)
      else parsed = value as WebSearchResponse
    } catch {
      parsed = null
    }

    if (!parsed?.results || parsed.results.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">{result ? "No search results found." : "Searching..."}</div>
      )
    }

    return (
      <div className="space-y-2">
        {parsed.results.map((searchResult, index) => (
          <div
            key={index}
            className="rounded-md p-2 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground line-clamp-1">
                  {searchResult.title}
                </h3>
                <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                  {searchResult.snippet}
                </p>
                <a
                  href={searchResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs mt-1 inline-block truncate max-w-full"
                >
                  {searchResult.url}
                </a>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 h-8 w-8 p-0"
                asChild
              >
                <a
                  href={searchResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open in new tab"
                >
                  <ExternalLinkIcon className="size-3" />
                </a>
              </Button>
            </div>
          </div>
        ))}
        <p className="text-muted-foreground text-[11px]">Found {parsed.results.length} result{parsed.results.length !== 1 ? 's' : ''}</p>
      </div>
    )
  }

  return (
    <ToolCallCard
      toolName="web_search"
      label="Searching web"
      argsText={argsText}
      result={result}
      icon={<SearchIcon className="h-4 w-4" />}
      renderOutput={renderOutput}
    />
  )
}

