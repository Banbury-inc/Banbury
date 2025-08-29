import ToolCallCard from "./ToolCallCard";
import type { ReactNode, SVGProps } from "react";
import { Button } from "@/components/ui/button";

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface WebSearchResponse {
  results: WebSearchResult[];
  query: string;
}

const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ExternalLinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

interface ToolCallProps {
  toolName: string;
  argsText: string;
  result?: unknown;
}

export const WebSearchTool = ({ toolName, argsText, result }: ToolCallProps) => {
  if (toolName !== "web_search") return null;

  const renderOutput = (value: unknown): ReactNode => {
    let parsed: WebSearchResponse | null = null;
    try {
      if (typeof value === "string") parsed = JSON.parse(value);
      else parsed = value as WebSearchResponse;
    } catch {
      parsed = null;
    }

    if (!parsed?.results || parsed.results.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">{result ? "No search results found." : "Searching..."}</div>
      );
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
    );
  };

  return (
    <ToolCallCard
      toolName="web_search"
      label="Searching web"
      argsText={argsText}
      result={result}
      icon={<SearchIcon className="h-4 w-4" />}
      renderOutput={renderOutput}
    />
  );
};

