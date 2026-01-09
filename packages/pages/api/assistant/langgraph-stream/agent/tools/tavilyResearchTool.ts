import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Tavily research input parameters
interface TavilyResearchInput {
  input: string
  model?: "mini" | "pro" | "auto"
  citationFormat?: "numbered" | "mla" | "apa" | "chicago"
  includeUsage?: boolean
}

// Research initiation response shape
interface ResearchResponse {
  request_id: string
  created_at: string
  status: string
  input: string
  model?: string
  response_time?: number
}

export const tavilyResearchTool = tool(
  async (input: TavilyResearchInput) => {
    try {
      const tavilyKey = process.env.TAVILY_API_KEY || "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"

      // Build request body
      const requestBody: any = {
        input: input.input,
        model: input.model || "auto",
        stream: false, // We don't want streaming for the agent
      }

      // Add citation format if provided
      if (input.citationFormat) {
        requestBody.citation_format = input.citationFormat
      }

      const response = await fetch("https://api.tavily.com/research", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const status = response.status
        let errorMsg = "Research initiation failed"

        if (status === 400) errorMsg = "Invalid parameters"
        else if (status === 401) errorMsg = "Invalid API key"
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

      const data: ResearchResponse = await response.json()

      // Return the request_id and status for polling
      return JSON.stringify({
        success: true,
        request_id: data.request_id,
        status: data.status,
        created_at: data.created_at,
        input: data.input,
        model: data.model,
        message: "Research task initiated. Use web_get_research with this request_id to retrieve results once processing completes (typically 30-120 seconds).",
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Request failed",
        details: "Failed to initiate research task",
      })
    }
  },
  {
    name: "web_research",
    description: "Initiate comprehensive research on a topic by conducting multiple searches, analyzing sources, and generating a detailed report. This is an ASYNC operation that returns a request_id. You must use web_get_research with the returned request_id to retrieve results. Research typically takes 30-120 seconds to complete. Best for in-depth analysis requiring multiple perspectives and sources.",
    schema: z.object({
      input: z.string().describe("The research topic or question to investigate comprehensively"),
      model: z.enum(["mini", "pro", "auto"]).optional().describe("Research model: mini (targeted), pro (multi-angle analysis), auto (default, balanced)"),
      citationFormat: z.enum(["numbered", "mla", "apa", "chicago"]).optional().describe("Citation format for sources (default: numbered)"),
      includeUsage: z.boolean().optional().describe("Include API credit usage information (default: false)"),
    }),
  }
)
