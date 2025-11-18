import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

// Memory management tools (integrated with Zep Cloud and Mem0)
export const createMemoryTool = tool(
  async (input: { content: string; dataType?: string; overflowStrategy?: string; sessionId?: string }) => {
    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")

    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    console.log(`Storing memory: ${input.content}`)
    
    // Get user information from context (in a real implementation, this would come from auth)
    const userInfo = {
      userId: "user123", // This should come from auth context
      workspaceId: "workspace123", // This should come from auth context
      email: "user@example.com", // This should come from auth context
      firstName: "User",
      lastName: "Example"
    }
    
    const chosenSessionId = input.sessionId || `assistant_ui`

    const response = await fetch(`${apiBase}/conversations/memory/enhanced/store/`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: input.content,
        type: input.dataType || "text",
        session_id: chosenSessionId,
        use_zep: true
      })
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const backendError = data?.error || data?.message || JSON.stringify(data || {})
      throw new Error(`Failed to store memory: HTTP ${response.status}${backendError ? ` - ${backendError}` : ''}`)
    }

    // Surface Zep diagnostics if present
    // Accept success shape from Django and surface diagnostics
    if (data?.success) {
      if (data?.zep?.stored_memory) {
        return `Memory stored successfully in Zep and Mongo. session_id: ${chosenSessionId}`
      }
      const diag = data?.zep ? JSON.stringify(data.zep, null, 2) : 'no zep diagnostics available'
      return `Memory stored in Mongo (Zep disabled or failed). session_id: ${chosenSessionId}. Diagnostics: ${diag}`
    }

    throw new Error(`Failed to store memory: ${data?.error || data?.message || 'Unknown error'}`)
  },
  {
    name: "store_memory",
    description: "Store important information in the user's memory for future reference. Use this to remember user preferences, important facts, or key information from conversations.",
    schema: z.object({
      content: z.string().describe("The information to store in memory"),
      dataType: z.string().optional().describe("Type of data being stored (text, json, message)"),
      overflowStrategy: z.string().optional().describe("How to handle data that exceeds size limits (truncate, split, fail)")
    })
  }
)

