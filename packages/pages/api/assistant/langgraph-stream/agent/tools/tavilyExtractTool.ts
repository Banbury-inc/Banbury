import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Tavily extract input parameters
interface TavilyExtractInput {
  urls: string | string[]
  query?: string
  chunksPerSource?: number
  extractDepth?: "basic" | "advanced"
  includeImages?: boolean
  includeFavicon?: boolean
  format?: "markdown" | "text"
  timeout?: number
  includeUsage?: boolean
}

// Extract result shapes
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
  results: ExtractResult[]
  failed_results?: FailedResult[]
  response_time?: number
  usage?: { credits: number }
  request_id?: string
}

export const tavilyExtractTool = tool(
  async (input: TavilyExtractInput) => {
    try {
      const tavilyKey = process.env.TAVILY_API_KEY || "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"

      // Normalize URLs input to array
      const urls = Array.isArray(input.urls) ? input.urls : [input.urls]

      // Validate URL count (max 20)
      if (urls.length > 20) {
        return JSON.stringify({
          success: false,
          error: "Too many URLs",
          details: "Maximum 20 URLs allowed per request",
        })
      }

      // Build request body
      const requestBody: any = {
        urls,
        extract_depth: input.extractDepth || "basic",
        include_images: input.includeImages ?? false,
        include_favicon: input.includeFavicon ?? false,
        format: input.format || "markdown",
        include_usage: input.includeUsage ?? false,
      }

      // Add query and chunks_per_source if query is provided
      if (input.query) {
        requestBody.query = input.query
        if (input.chunksPerSource) {
          requestBody.chunks_per_source = Math.max(1, Math.min(input.chunksPerSource, 5))
        }
      }

      // Add timeout if provided
      if (input.timeout) {
        requestBody.timeout = Math.max(1.0, Math.min(input.timeout, 60.0))
      }

      const response = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const status = response.status
        let errorMsg = "Extraction failed"

        if (status === 400) errorMsg = "Invalid parameters"
        else if (status === 401) errorMsg = "Invalid API key"
        else if (status === 403) errorMsg = "Unsupported URL"
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

      const data: ExtractResponse = await response.json()

      // Return successful response with results and any failures
      return JSON.stringify({
        success: true,
        results: data.results || [],
        failed_results: data.failed_results || [],
        response_time: data.response_time,
        usage: data.usage,
        query: input.query,
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Request failed",
        details: "Failed to extract content from URLs",
      })
    }
  },
  {
    name: "web_extract",
    description: "Extract raw content from URLs (up to 20 simultaneously). Useful for gathering content from specific web pages for research or document creation. Can optionally rerank content chunks based on a query for focused extraction.",
    schema: z.object({
      urls: z.union([z.string(), z.array(z.string())]).describe("URL or array of URLs to extract content from (max 20)"),
      query: z.string().optional().describe("User intent for reranking extracted content chunks by relevance"),
      chunksPerSource: z.number().int().min(1).max(5).optional().describe("Maximum number of relevant chunks per source (1-5, requires query parameter)"),
      extractDepth: z.enum(["basic", "advanced"]).optional().describe("Extraction depth: basic (faster) or advanced (includes tables and embedded content)"),
      includeImages: z.boolean().optional().describe("Include list of extracted images from the pages"),
      includeFavicon: z.boolean().optional().describe("Include favicon URL for each result"),
      format: z.enum(["markdown", "text"]).optional().describe("Output format: markdown (default) or plain text"),
      timeout: z.number().min(1.0).max(60.0).optional().describe("Request timeout in seconds (1-60, default: 10s for basic, 30s for advanced)"),
      includeUsage: z.boolean().optional().describe("Include API credit usage information in response"),
    }),
  }
)
