import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Get research input parameters
interface TavilyGetResearchInput {
  requestId: string
}

// Research result response shapes
interface Source {
  url: string
  title?: string
  snippet?: string
}

interface ResearchResult {
  request_id: string
  status: "pending" | "completed" | "failed"
  input?: string
  model?: string
  report?: string
  sources?: Source[]
  created_at?: string
  completed_at?: string
  response_time?: number
  usage?: { credits: number }
  error?: string
}

export const tavilyGetResearchTool = tool(
  async (input: TavilyGetResearchInput) => {
    try {
      const tavilyKey = process.env.TAVILY_API_KEY || "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"

      const response = await fetch(`https://api.tavily.com/research/${input.requestId}`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
      })

      if (!response.ok) {
        const status = response.status
        let errorMsg = "Failed to retrieve research results"

        if (status === 400) errorMsg = "Invalid request ID"
        else if (status === 401) errorMsg = "Invalid API key"
        else if (status === 404) errorMsg = "Research task not found"
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

      const data: ResearchResult = await response.json()

      // Return different responses based on status
      if (data.status === "pending") {
        return JSON.stringify({
          success: true,
          status: "pending",
          request_id: data.request_id,
          input: data.input,
          message: "Research is still processing. Please wait a few moments and try again with web_get_research.",
        })
      }

      if (data.status === "failed") {
        return JSON.stringify({
          success: false,
          status: "failed",
          request_id: data.request_id,
          error: data.error || "Research task failed",
        })
      }

      // Completed successfully
      return JSON.stringify({
        success: true,
        status: "completed",
        request_id: data.request_id,
        input: data.input,
        model: data.model,
        report: data.report,
        sources: data.sources || [],
        completed_at: data.completed_at,
        response_time: data.response_time,
        usage: data.usage,
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Request failed",
        details: "Failed to retrieve research results",
      })
    }
  },
  {
    name: "web_get_research",
    description: "Retrieve the results of a research task initiated with web_research. Polls the research status and returns the report when completed. If status is 'pending', wait 10-20 seconds and poll again. Research tasks typically complete in 30-120 seconds.",
    schema: z.object({
      requestId: z.string().describe("The unique request_id returned from web_research"),
    }),
  }
)
