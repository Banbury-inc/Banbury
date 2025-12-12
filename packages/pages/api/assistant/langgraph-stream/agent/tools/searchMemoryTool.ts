import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

export const searchMemoryTool = tool(
  async (input: { query: string; scope?: string; reranker?: string; maxResults?: number; sessionId?: string }) => {
    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")

    if (!token) {
      throw new Error("Missing auth token in server context")
    }
    
    // Get user information from context (in a real implementation, this would come from auth)
    const userInfo = {
      userId: "user123", // This should come from auth context
      workspaceId: "workspace123", // This should come from auth context
      email: "user@example.com", // This should come from auth context
      firstName: "User",
      lastName: "Example"
    }
    
    const chosenSessionId = input.sessionId || `assistant_ui`

    const params = new URLSearchParams({
      query: input.query,
      scope: input.scope || "nodes",
      reranker: input.reranker || "cross_encoder",
      limit: String(input.maxResults || 10),
      use_zep: "true",
      session_id: chosenSessionId
    })
    
    const response = await fetch(`${apiBase}/conversations/memory/enhanced/search/?${params}`, {
      method: 'GET',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      let message = `HTTP ${response.status}`
      try {
        const data = await response.json()
        if (data?.error) message += ` - ${data.error}`
      } catch {}
      throw new Error(`Failed to search memories: ${message}`)
    }

    const data = await response.json()
    
    if (data.success) {
      // Combine MongoDB and Zep results
      let response = "Memory search results (Zep):\n\n"
      if (typeof data.used_strategy !== 'undefined') {
        response += `Strategy: ${data.used_strategy}${data.used_user_id ? `, user: ${data.used_user_id}` : ''}\n\n`
      }
      
      // Mongo results suppressed when use_zep=true
      
      if (data.zep_facts && data.zep_facts.length > 0) {
        response += "Zep Facts:\n"
        data.zep_facts.forEach((fact: any, index: number) => {
          response += `${index + 1}. ${fact.fact} (confidence: ${fact.confidence.toFixed(2)})\n`
        })
        response += "\n"
      }
      
      if (data.zep_entities && data.zep_entities.length > 0) {
        response += "Zep Entities:\n"
        data.zep_entities.forEach((entity: any, index: number) => {
          response += `${index + 1}. ${entity.name} (${entity.type})\n`
          response += `   Summary: ${entity.summary}\n`
        })
      }
      
      if (data.count === 0) {
        return "No relevant memories found for the given query."
      }
      
      return response
    } else {
      throw new Error(`Failed to search memories: ${data.error || 'Unknown error'}`)
    }
  },
  {
    name: "search_memory",
    description: "Search through the user's memories from previous conversations and interactions. Use this to find relevant information about the user's preferences, past conversations, or stored knowledge.",
    schema: z.object({
      query: z.string().describe("Simple, concise search query to find relevant memories"),
      scope: z.string().optional().describe("Scope of the search: 'nodes' for entities/concepts, 'edges' for relationships/facts"),
      reranker: z.string().optional().describe("Method to rerank results for better relevance (cross_encoder, rrf, mmr, episode_mentions)"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)")
    })
  }
)

