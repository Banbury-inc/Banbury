import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Tavily crawl input parameters
interface TavilyCrawlInput {
  url: string
  instructions?: string
  chunksPerSource?: number
  maxDepth?: number
  maxBreadth?: number
  limit?: number
  selectPaths?: string[]
  selectDomains?: string[]
  excludePaths?: string[]
  excludeDomains?: string[]
  allowExternal?: boolean
  includeImages?: boolean
  extractDepth?: "basic" | "advanced"
  format?: "markdown" | "text"
  includeFavicon?: boolean
  timeout?: number
  includeUsage?: boolean
}

// Crawl result shape
interface CrawlResult {
  url: string
  raw_content: string
  favicon?: string
}

interface CrawlResponse {
  base_url: string
  results: CrawlResult[]
  response_time?: number
  usage?: { credits: number }
  request_id?: string
}

export const tavilyCrawlTool = tool(
  async (input: TavilyCrawlInput) => {
    try {
      const tavilyKey = process.env.TAVILY_API_KEY || "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"

      // Build request body
      const requestBody: any = {
        url: input.url,
        extract_depth: input.extractDepth || "basic",
        format: input.format || "markdown",
        allow_external: input.allowExternal ?? true,
        include_images: input.includeImages ?? false,
        include_favicon: input.includeFavicon ?? false,
        include_usage: input.includeUsage ?? false,
      }

      // Add optional parameters
      if (input.instructions) requestBody.instructions = input.instructions
      if (input.chunksPerSource) requestBody.chunks_per_source = Math.max(1, Math.min(input.chunksPerSource, 5))
      if (input.maxDepth) requestBody.max_depth = Math.max(1, Math.min(input.maxDepth, 5))
      if (input.maxBreadth) requestBody.max_breadth = input.maxBreadth
      if (input.limit) requestBody.limit = input.limit
      if (input.selectPaths && input.selectPaths.length > 0) requestBody.select_paths = input.selectPaths
      if (input.selectDomains && input.selectDomains.length > 0) requestBody.select_domains = input.selectDomains
      if (input.excludePaths && input.excludePaths.length > 0) requestBody.exclude_paths = input.excludePaths
      if (input.excludeDomains && input.excludeDomains.length > 0) requestBody.exclude_domains = input.excludeDomains

      // Add timeout if provided (10-150 seconds)
      if (input.timeout) {
        requestBody.timeout = Math.max(10, Math.min(input.timeout, 150))
      }

      const response = await fetch("https://api.tavily.com/crawl", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const status = response.status
        let errorMsg = "Crawl failed"

        if (status === 400) errorMsg = "Invalid parameters"
        else if (status === 401) errorMsg = "Invalid API key"
        else if (status === 403) errorMsg = "URL not supported"
        else if (status === 429) errorMsg = "Rate limit exceeded"
        else if (status === 432) errorMsg = "Plan limit exceeded"
        else if (status === 433) errorMsg = "Pay-as-you-go limit exceeded"
        else if (status >= 500) errorMsg = "Server error"

        return JSON.stringify({
          success: false,
          error: errorMsg,
          details: `HTTP ${status}`,
        })
      }

      const data: CrawlResponse = await response.json()

      // Return successful response organized by depth if possible
      return JSON.stringify({
        success: true,
        base_url: data.base_url,
        results: data.results || [],
        total_pages: data.results?.length || 0,
        response_time: data.response_time,
        usage: data.usage,
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Request failed",
        details: "Failed to crawl website",
      })
    }
  },
  {
    name: "web_crawl",
    description: "Crawl a website using graph-based traversal to explore hundreds of paths in parallel. Extracts content from discovered pages with intelligent path discovery. Best for deep site exploration and content gathering from entire sections of a website. Can take 10-150 seconds depending on scope.",
    schema: z.object({
      url: z.string().describe("Root URL to begin crawling (e.g., 'docs.tavily.com')"),
      instructions: z.string().optional().describe("Natural language instructions to guide crawler behavior (increases cost to 2 credits per 10 pages)"),
      chunksPerSource: z.number().int().min(1).max(5).optional().describe("Maximum number of relevant content snippets per source (1-5, default: 3)"),
      maxDepth: z.number().int().min(1).max(5).optional().describe("Maximum depth from base URL to explore (1-5, default: 1)"),
      maxBreadth: z.number().int().min(1).optional().describe("Maximum links to process per page level (default: 20)"),
      limit: z.number().int().min(1).optional().describe("Total links to process before stopping (default: 50)"),
      selectPaths: z.array(z.string()).optional().describe("Regex patterns to include specific URL paths"),
      selectDomains: z.array(z.string()).optional().describe("Regex patterns to restrict to specific domains"),
      excludePaths: z.array(z.string()).optional().describe("Regex patterns to exclude specific URL paths"),
      excludeDomains: z.array(z.string()).optional().describe("Regex patterns to exclude specific domains"),
      allowExternal: z.boolean().optional().describe("Include external domain links in results (default: true)"),
      includeImages: z.boolean().optional().describe("Include images in extraction results (default: false)"),
      extractDepth: z.enum(["basic", "advanced"]).optional().describe("Extraction depth: basic (1 credit per 5) or advanced (2 credits per 5, includes tables and embedded content)"),
      format: z.enum(["markdown", "text"]).optional().describe("Output format: markdown (default) or plain text"),
      includeFavicon: z.boolean().optional().describe("Include favicon URL for each result (default: false)"),
      timeout: z.number().min(10).max(150).optional().describe("Maximum operation duration in seconds (10-150, default: 150)"),
      includeUsage: z.boolean().optional().describe("Include API credit usage information in response (default: false)"),
    }),
  }
)
