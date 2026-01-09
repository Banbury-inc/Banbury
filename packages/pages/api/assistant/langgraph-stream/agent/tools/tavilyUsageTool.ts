import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Usage response shape
interface UsageResponse {
  key: {
    usage: number
    limit: number
  }
  account: {
    current_plan: string
    plan_usage: number
    plan_limit: number
    paygo_usage: number
    paygo_limit: number
  }
}

export const tavilyUsageTool = tool(
  async () => {
    try {
      const tavilyKey = process.env.TAVILY_API_KEY || "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"

      const response = await fetch("https://api.tavily.com/usage", {
        method: "GET",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
      })

      if (!response.ok) {
        const status = response.status
        let errorMsg = "Failed to retrieve usage statistics"

        if (status === 401) errorMsg = "Invalid API key"
        else if (status === 429) errorMsg = "Rate limit exceeded"
        else if (status >= 500) errorMsg = "Server error"

        return JSON.stringify({
          success: false,
          error: errorMsg,
          details: `HTTP ${status}`,
        })
      }

      const data: UsageResponse = await response.json()

      // Calculate percentages for better visualization
      const keyPercentage = data.key.limit > 0 ? (data.key.usage / data.key.limit) * 100 : 0
      const planPercentage = data.account.plan_limit > 0 ? (data.account.plan_usage / data.account.plan_limit) * 100 : 0
      const paygoPercentage = data.account.paygo_limit > 0 ? (data.account.paygo_usage / data.account.paygo_limit) * 100 : 0

      // Return successful response with usage statistics
      return JSON.stringify({
        success: true,
        key: {
          usage: data.key.usage,
          limit: data.key.limit,
          percentage: Math.round(keyPercentage),
        },
        account: {
          current_plan: data.account.current_plan,
          plan_usage: data.account.plan_usage,
          plan_limit: data.account.plan_limit,
          plan_percentage: Math.round(planPercentage),
          paygo_usage: data.account.paygo_usage,
          paygo_limit: data.account.paygo_limit,
          paygo_percentage: Math.round(paygoPercentage),
        },
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Request failed",
        details: "Failed to retrieve API usage statistics",
      })
    }
  },
  {
    name: "web_usage",
    description: "Retrieve API key and account usage statistics including current consumption, limits, and plan details. Useful for monitoring API usage and checking remaining credits.",
    schema: z.object({
      // No parameters needed - uses API key from environment
    }),
  }
)
