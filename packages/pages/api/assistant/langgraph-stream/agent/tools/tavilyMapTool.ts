import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Tavily map input parameters
interface TavilyMapInput {
  url: string
  instructions?: string
  maxDepth?: number
  maxBreadth?: number
  limit?: number
  selectPaths?: string[]
  selectDomains?: string[]
  excludePaths?: string[]
  excludeDomains?: string[]
  allowExternal?: boolean
  timeout?: number
  includeUsage?: boolean
}

// Map response shape
interface MapResponse {
  base_url: string
  results: string[]
  response_time?: number
  usage?: { credits: number }
  request_id?: string
}

export const tavilyMapTool = tool(
  async (input: TavilyMapInput) => {
    try {
      const tavilyKey = process.env.TAVILY_API_KEY || "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"

      // Build request body
      const requestBody: any = {
        url: input.url,
        allow_external: input.allowExternal ?? true,
        include_usage: input.includeUsage ?? false,
      }

      // Add optional parameters
      if (input.instructions) requestBody.instructions = input.instructions
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

      const response = await fetch("https://api.tavily.com/map", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const status = response.status
        let errorMsg = "Map operation failed"

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

      const data: MapResponse = await response.json()

      // Return successful response with URL structure
      return JSON.stringify({
        success: true,
        base_url: data.base_url,
        results: data.results || [],
        total_urls: data.results?.length || 0,
        response_time: data.response_time,
        usage: data.usage,
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Request failed",
        details: "Failed to map website structure",
      })
    }
  },
  {
    name: "web_map",
    description: "Generate a comprehensive site map by traversing a website as a graph. Returns a list of discovered URLs without content extraction. Best for understanding site structure and discovering all pages on a website. Can take 10-150 seconds depending on site size.",
    schema: z.object({
      url: z.string().describe("Root URL to begin mapping (e.g., 'docs.tavily.com')"),
      instructions: z.string().optional().describe("Natural language instructions to guide mapping behavior (increases cost to 2 credits per 10 pages)"),
      maxDepth: z.number().int().min(1).max(5).optional().describe("Maximum depth from base URL to explore (1-5, default: 1)"),
      maxBreadth: z.number().int().min(1).optional().describe("Maximum links to process per page level (default: 20)"),
      limit: z.number().int().min(1).optional().describe("Total links to process before stopping (default: 50)"),
      selectPaths: z.array(z.string()).optional().describe("Regex patterns to include specific URL paths (e.g., ['/docs/.*'])"),
      selectDomains: z.array(z.string()).optional().describe("Regex patterns to restrict to specific domains"),
      excludePaths: z.array(z.string()).optional().describe("Regex patterns to exclude specific URL paths"),
      excludeDomains: z.array(z.string()).optional().describe("Regex patterns to exclude specific domains"),
      allowExternal: z.boolean().optional().describe("Include external domain links in results (default: true)"),
      timeout: z.number().min(10).max(150).optional().describe("Maximum operation duration in seconds (10-150, default: 150)"),
      includeUsage: z.boolean().optional().describe("Include API credit usage information in response (default: false)"),
    }),
  }
)
