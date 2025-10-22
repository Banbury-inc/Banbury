import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../config/config"
import { getServerContextValue } from "../../serverContext"

// File search tool
export const searchFilesTool = tool(
  async (input: { query: string }) => {
    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")

    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    console.log(`Searching files with query: ${input.query}`)
    
    const response = await fetch(`${apiBase}/files/search_s3_files/`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: input.query })
    })

    if (!response.ok) {
      let message = `HTTP ${response.status}`
      try {
        const data = await response.json()
        if (data?.error) message += ` - ${data.error}`
      } catch {}
      throw new Error(`Failed to search files: ${message}`)
    }

    const data = await response.json()
    
    if (data.result === 'success') {
      return JSON.stringify({
        success: true,
        files: data.files || [],
        total_results: data.total_results || 0,
        query: input.query,
        message: `Found ${data.total_results || 0} files matching "${input.query}"`
      })
    } else {
      return JSON.stringify({
        success: false,
        error: data.error || 'Search failed',
        query: input.query
      })
    }
  },
  {
    name: "search_files",
    description: "Search for files in the user's cloud storage by file name. Use this to find specific files or files containing certain keywords in their names.",
    schema: z.object({
      query: z.string().describe("The search query to match against file names (case-insensitive)")
    })
  }
)

