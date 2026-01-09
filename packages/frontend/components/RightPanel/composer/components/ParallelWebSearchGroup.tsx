import { useState, useMemo } from "react"
import type { SVGProps } from "react"
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

interface WebSearchToolCall {
  toolCallId: string
  toolName: string
  args: { query: string; [key: string]: any }
  result?: unknown
}

interface ParallelWebSearchGroupProps {
  searches: WebSearchToolCall[]
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

const ChevronDown = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronUp = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

function SingleSearchResult({ search }: { search: WebSearchToolCall }) {
  const [showResults, setShowResults] = useState(false)
  const isRunning = search.result === undefined

  const parsedResult = useMemo(() => {
    if (!search.result) return null
    try {
      if (typeof search.result === "string") return JSON.parse(search.result) as WebSearchResponse
      return search.result as WebSearchResponse
    } catch {
      return null
    }
  }, [search.result])

  const resultCount = parsedResult?.results?.length || 0

  return (
    <div className="border-b border-border/50 last:border-b-0 py-2 px-1">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <SearchIcon className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-foreground truncate" title={search.args.query}>
            "{search.args.query}"
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isRunning ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Check className="h-3 w-3 text-green-600" />
              {resultCount > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {resultCount} result{resultCount !== 1 ? "s" : ""}
                </span>
              )}
            </>
          )}
          {!isRunning && resultCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setShowResults(!showResults)}
            >
              {showResults ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {showResults && parsedResult?.results && parsedResult.results.length > 0 && (
        <div className="mt-2 pl-4 space-y-1.5">
          {parsedResult.results.slice(0, 5).map((result, index) => (
            <div
              key={index}
              className="rounded p-1.5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs text-foreground line-clamp-1">
                    {result.title}
                  </h4>
                  <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2">
                    {result.snippet}
                  </p>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-[10px] mt-0.5 inline-block truncate max-w-full"
                  >
                    {result.url}
                  </a>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 h-6 w-6 p-0"
                  asChild
                >
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open in new tab"
                  >
                    <ExternalLinkIcon className="size-2.5" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
          {parsedResult.results.length > 5 && (
            <p className="text-[10px] text-muted-foreground pl-1.5">
              +{parsedResult.results.length - 5} more results
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function ParallelWebSearchGroup({ searches }: ParallelWebSearchGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const completedCount = searches.filter(s => s.result !== undefined).length
  const totalCount = searches.length
  const isRunning = completedCount < totalCount

  const totalResults = useMemo(() => {
    return searches.reduce((acc, search) => {
      if (!search.result) return acc
      try {
        const parsed = typeof search.result === "string" 
          ? JSON.parse(search.result) as WebSearchResponse
          : search.result as WebSearchResponse
        return acc + (parsed?.results?.length || 0)
      } catch {
        return acc
      }
    }, 0)
  }, [searches])

  return (
    <div className="mb-2 w-full rounded-md border border-border/50 bg-muted/20">
      {/* Header */}
      <div 
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors rounded-t-md"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5">
          <SearchIcon className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-sm text-foreground">
            Parallel Web Search
          </span>
          <span className="text-xs text-muted-foreground">
            ({totalCount} {totalCount === 1 ? "query" : "queries"})
          </span>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {isRunning ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{completedCount}/{totalCount}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <Check className="h-3 w-3" />
              <span>{totalResults} total results</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Search list */}
      {isExpanded && (
        <div className="border-t border-border/50">
          {searches.map((search) => (
            <SingleSearchResult
              key={search.toolCallId}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ParallelWebSearchGroup
