import { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { ExternalLinkIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "./ui/button";

import type { FC } from "react";

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface WebSearchResponse {
  results: WebSearchResult[];
  query: string;
}

export const WebSearchTool: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  if (toolName !== "web_search") return null;

  let parsedResult: WebSearchResponse | null = null;
  let parsedArgs: { query?: string } | null = null;

  try {
    if (typeof result === "string") {
      parsedResult = JSON.parse(result);
    }
  } catch {
    // Handle parsing error gracefully
  }

  try {
    parsedArgs = JSON.parse(argsText);
  } catch {
    // Handle parsing error gracefully
  }

  const searchQuery = parsedArgs?.query || "Unknown query";

  return (
    <div className="mb-4 w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-700 px-4 py-3">
        <SearchIcon className="size-4 text-blue-500" />
        <span className="font-medium text-sm">Web Search</span>
        <span className="text-muted-foreground text-sm flex-1">
          "{searchQuery}"
        </span>
        <Button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
        >
          {isCollapsed ? <ChevronDownIcon className="size-3" /> : <ChevronUpIcon className="size-3" />}
        </Button>
      </div>
      
      {!isCollapsed && (
        <>
          {parsedResult?.results && parsedResult.results.length > 0 ? (
            <div className="p-4 space-y-3">
              {parsedResult.results.map((searchResult, index) => (
                <div
                  key={index}
                  className="border border-zinc-200 dark:border-zinc-700 rounded-md p-3 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
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
              
              {parsedResult.results.length > 0 && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-muted-foreground text-xs text-center">
                    Found {parsedResult.results.length} result{parsedResult.results.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-muted-foreground text-sm">
                {result ? "No search results found." : "Searching..."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

