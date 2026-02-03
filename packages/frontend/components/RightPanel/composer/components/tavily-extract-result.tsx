import { useMemo, useState } from "react"
import ToolCallCard from "./ToolCallCard"
import type { ReactNode, SVGProps } from "react"
import { Button } from "@/components/common/ui/button"

interface ExtractResult {
  url: string
  raw_content: string
  images?: string[]
  favicon?: string
}

interface FailedResult {
  url: string
  error: string
}

interface ExtractResponse {
  success: boolean
  results: ExtractResult[]
  failed_results?: FailedResult[]
  response_time?: number
  usage?: { credits: number }
  query?: string
  error?: string
  details?: string
}

const ExtractIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
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

export const TavilyExtractTool = ({ toolName, toolCallId, argsText, args, result }: ToolCallProps) => {
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set())

  const parsedArgs = useMemo(() => {
    if (args) return args
    try {
      return JSON.parse(argsText || "{}")
    } catch {
      return { urls: [] }
    }
  }, [args, argsText])

  if (toolName !== "web_extract") return null

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
    let parsed: ExtractResponse | null = null
    try {
      if (typeof value === "string") parsed = JSON.parse(value)
      else parsed = value as ExtractResponse
    } catch {
      parsed = null
    }

    // Error state
    if (parsed && !parsed.success) {
      return (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertIcon className="size-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">{parsed.error || "Extraction failed"}</div>
            {parsed.details && <div className="text-xs mt-0.5">{parsed.details}</div>}
          </div>
        </div>
      )
    }

    // Loading state
    if (!parsed?.results) {
      return (
        <div className="text-sm text-muted-foreground">{result ? "No results found." : "Extracting content..."}</div>
      )
    }

    const { results, failed_results, usage } = parsed

    return (
      <div className="space-y-3">
        {/* Successful extractions */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((extractResult, index) => {
              const isExpanded = expandedUrls.has(extractResult.url)
              const contentPreview = extractResult.raw_content?.slice(0, 200) || ""
              const hasMore = (extractResult.raw_content?.length || 0) > 200

              return (
                <div
                  key={index}
                  className="rounded-md border border-zinc-200 dark:border-zinc-700 p-3 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {extractResult.favicon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={extractResult.favicon} alt="" className="size-4 shrink-0" />
                        )}
                        <a
                          href={extractResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium truncate"
                        >
                          {extractResult.url}
                        </a>
                      </div>

                      {/* Content preview */}
                      <div className="mt-2 text-sm text-foreground/90">
                        <p className={isExpanded ? "" : "line-clamp-3"}>
                          {isExpanded ? extractResult.raw_content : contentPreview}
                          {!isExpanded && hasMore && "..."}
                        </p>
                      </div>

                      {/* Images */}
                      {extractResult.images && extractResult.images.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {extractResult.images.slice(0, 3).map((img, imgIdx) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={imgIdx}
                              src={img}
                              alt=""
                              className="size-12 object-cover rounded border border-zinc-200 dark:border-zinc-700"
                            />
                          ))}
                          {extractResult.images.length > 3 && (
                            <div className="size-12 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-700 text-xs text-muted-foreground">
                              +{extractResult.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expand/collapse button */}
                      {hasMore && (
                        <button
                          onClick={() => toggleExpand(extractResult.url)}
                          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                          <ChevronDownIcon className={`size-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-8 w-8 p-0"
                      asChild
                    >
                      <a
                        href={extractResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open in new tab"
                      >
                        <ExternalLinkIcon className="size-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Failed extractions */}
        {failed_results && failed_results.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Failed Extractions</div>
            {failed_results.map((failed, index) => (
              <div
                key={index}
                className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-2"
              >
                <div className="flex items-start gap-2">
                  <AlertIcon className="size-3 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-red-600 dark:text-red-400 truncate">{failed.url}</div>
                    <div className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5">{failed.error}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer with stats */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {results.length} extracted{results.length !== 1 ? "" : ""}
            {failed_results && failed_results.length > 0 && `, ${failed_results.length} failed`}
          </span>
          {usage && <span>{usage.credits} credit{usage.credits !== 1 ? "s" : ""} used</span>}
        </div>
      </div>
    )
  }

  // Create label from args
  const urlsArray = Array.isArray(parsedArgs.urls) ? parsedArgs.urls : [parsedArgs.urls]
  const label = urlsArray.length === 1
    ? `Extracting content from URL`
    : `Extracting content from ${urlsArray.length} URLs`

  return (
    <ToolCallCard
      toolName="web_extract"
      label={label}
      argsText={argsText}
      result={result}
      icon={<ExtractIcon className="h-4 w-4" />}
      renderOutput={renderOutput}
    />
  )
}
