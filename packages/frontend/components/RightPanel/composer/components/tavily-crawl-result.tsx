import { useMemo, useState } from "react"
import ToolCallCard from "./ToolCallCard"
import type { ReactNode, SVGProps } from "react"
import { Button } from "frontend/components/ui/button"

interface CrawlResult {
  url: string
  raw_content: string
  favicon?: string
}

interface CrawlResponse {
  success: boolean
  base_url: string
  results: CrawlResult[]
  total_pages: number
  response_time?: number
  usage?: { credits: number }
  error?: string
  details?: string
}

const CrawlIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const ExternalLinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <polyline points="6 9 12 15 18 9" />
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

export const TavilyCrawlTool = ({ toolName, toolCallId, argsText, args, result }: ToolCallProps) => {
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set())

  const parsedArgs = useMemo(() => {
    if (args) return args
    try {
      return JSON.parse(argsText || "{}")
    } catch {
      return { url: "Unknown URL" }
    }
  }, [args, argsText])

  if (toolName !== "web_crawl") return null

  const toggleExpand = (url: string) => {
    setExpandedUrls(prev => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else {
        next.add(url)
      }
      return next
    })
  }

  const renderOutput = (value: unknown): ReactNode => {
    let parsed: CrawlResponse | null = null
    try {
      if (typeof value === "string") parsed = JSON.parse(value)
      else parsed = value as CrawlResponse
    } catch {
      parsed = null
    }

    // Error state
    if (parsed && !parsed.success) {
      return (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertIcon className="size-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">{parsed.error || "Crawl failed"}</div>
            {parsed.details && <div className="text-xs mt-0.5">{parsed.details}</div>}
          </div>
        </div>
      )
    }

    // Loading state
    if (!parsed?.results) {
      return (
        <div className="text-sm text-muted-foreground">{result ? "No pages found." : "Crawling website..."}</div>
      )
    }

    const { base_url, results, total_pages, usage } = parsed

    return (
      <div className="space-y-3">
        {/* Base URL header */}
        <div className="text-xs text-muted-foreground">
          Crawled from: <span className="font-medium">{base_url}</span>
        </div>

        {/* Crawled pages */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((crawlResult, index) => {
              const isExpanded = expandedUrls.has(crawlResult.url)
              const contentPreview = crawlResult.raw_content?.slice(0, 150) || ""
              const hasMore = (crawlResult.raw_content?.length || 0) > 150

              // Check if URL is external to base
              const isExternal = !crawlResult.url.includes(base_url)

              return (
                <div
                  key={index}
                  className="rounded-md border border-zinc-200 dark:border-zinc-700 p-2.5 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {crawlResult.favicon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={crawlResult.favicon} alt="" className="size-3.5 shrink-0" />
                        )}
                        {isExternal && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                            EXT
                          </span>
                        )}
                        <a
                          href={crawlResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs truncate"
                        >
                          {crawlResult.url}
                        </a>
                      </div>

                      {/* Content preview */}
                      {crawlResult.raw_content && (
                        <div className="mt-1.5 text-xs text-foreground/80">
                          <p className={isExpanded ? "" : "line-clamp-2"}>
                            {isExpanded ? crawlResult.raw_content : contentPreview}
                            {!isExpanded && hasMore && "..."}
                          </p>
                        </div>
                      )}

                      {/* Expand/collapse button */}
                      {hasMore && (
                        <button
                          onClick={() => toggleExpand(crawlResult.url)}
                          className="mt-1.5 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5"
                        >
                          <ChevronDownIcon className={`size-2.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-7 w-7 p-0"
                      asChild
                    >
                      <a
                        href={crawlResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open in new tab"
                      >
                        <ExternalLinkIcon className="size-2.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer with stats */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{total_pages} page{total_pages !== 1 ? "s" : ""} crawled</span>
          {usage && <span>{usage.credits} credit{usage.credits !== 1 ? "s" : ""} used</span>}
        </div>
      </div>
    )
  }

  const label = `Crawling website: ${parsedArgs.url}`

  return (
    <ToolCallCard
      toolName="web_crawl"
      label={label}
      argsText={argsText}
      result={result}
      icon={<CrawlIcon className="h-4 w-4" />}
      renderOutput={renderOutput}
    />
  )
}
