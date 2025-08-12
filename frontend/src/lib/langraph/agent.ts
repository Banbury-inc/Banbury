import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { BaseMessage } from "@langchain/core/messages";

// Define our agent state
interface AgentState {
  messages: BaseMessage[];
  step: number;
  error?: string;
}

// Create tools following athena-intelligence patterns
const webSearchTool = tool(
  async (input: { query: string }) => {
    type Result = { title: string; url: string; snippet: string };

    const normalizeUrl = (raw: string | undefined): string | null => {
      if (!raw) return null;
      try {
        const u = new URL(raw);
        return u.toString();
      } catch {
        return null;
      }
    };

    const fetchWithTimeout = async (url: string, ms: number): Promise<string | null> => {
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), ms);
      try {
        const resp = await fetch(url, { signal: controller.signal, headers: { "user-agent": "Mozilla/5.0" } });
        if (!resp.ok) return null;
        const text = await resp.text();
        return text || null;
      } catch {
        return null;
      } finally {
        clearTimeout(to);
      }
    };

    const extractMeta = (html: string, name: string): string | null => {
      const rx = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
      const m = html.match(rx);
      return m?.[1] || null;
    };

    const extractTitle = (html: string): string | null => {
      const og = extractMeta(html, "og:title");
      if (og) return og;
      const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return m?.[1] || null;
    };

    const extractDescription = (html: string): string | null => {
      const ogd = extractMeta(html, "og:description") || extractMeta(html, "twitter:description") || extractMeta(html, "description");
      if (ogd) return ogd;
      const p = html.match(/<p[^>]*>(.*?)<\/p>/i);
      if (p?.[1]) return p[1].replace(/<[^>]+>/g, "").trim();
      return null;
    };

    // Prefer Tavily if available for high-quality, content-rich results
    const results: Result[] = [];
    const tavilyKey = process.env.TAVILY_API_KEY || "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";
    if (tavilyKey) {
      try {
        const tavilyResp = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${tavilyKey}` },
          body: JSON.stringify({
            query: input.query,
            search_depth: "advanced",
            include_answer: true,
            include_raw_content: true,
            max_results: 6,
          }),
        });
        if (tavilyResp.ok) {
          const data: any = await tavilyResp.json();
          const items: any[] = Array.isArray(data?.results) ? data.results : [];
          for (const r of items) {
            const url = normalizeUrl(r?.url);
            const title = (r?.title || "Result").toString();
            const snippet = (r?.content || r?.raw_content || "").toString().slice(0, 500);
            if (url) results.push({ title, url, snippet });
            if (results.length >= 5) break;
          }
        }
      } catch {}
    }

    // Fallback to DuckDuckGo + enrichment if Tavily is unavailable or returned nothing
    if (results.length === 0) {
      try {
        const mod: any = await import("duck-duck-scrape");
        const search = mod.search || mod.default?.search || mod;
        const ddg: any = await search(input.query, { maxResults: 8 });
        const items: any[] = Array.isArray(ddg?.results) ? ddg.results : Array.isArray(ddg) ? ddg : [];
        for (const r of items) {
          const url = normalizeUrl(r.url || r.link || r.href);
          if (!url) continue;
          const title = (r.title || r.name || r.text || "Result").toString();
          const snippet = (r.description || r.snippet || r.text || "").toString();
          results.push({ title, url, snippet });
          if (results.length >= 5) break;
        }
      } catch {}
    }

    // Enrich results by fetching page content
    const enrichPromises = results.map(async (r) => {
      const html = await fetchWithTimeout(r.url, 4500);
      if (!html) return r;
      const title = extractTitle(html) || r.title;
      const desc = extractDescription(html) || r.snippet || "";
      return { title, url: r.url, snippet: desc } as Result;
    });
    const enrichedSettled = await Promise.allSettled(enrichPromises);
    const enriched = enrichedSettled
      .map((p) => (p.status === "fulfilled" ? p.value : null))
      .filter((x): x is Result => !!x);

    if (enriched.length === 0) {
      const fallbackUrl = `https://duckduckgo.com/?q=${encodeURIComponent(input.query)}`;
      return JSON.stringify({
        results: [
          { title: `Search Results for "${input.query}"`, url: fallbackUrl, snippet: `Click to view search results for "${input.query}" on DuckDuckGo.` },
        ],
        query: input.query,
      });
    }

    return JSON.stringify({ results: enriched, query: input.query });
  },
  { 
    name: "web_search", 
    description: "Search the web and read page content for summaries", 
    schema: z.object({ query: z.string() }) 
  }
);

const tiptapAiTool = tool(
  async (input: { action: string; content: string; selection?: { from: number; to: number; text: string }; targetText?: string; actionType: string; language?: string }) => {
    // This tool formats AI-generated content for Tiptap editor integration
    return {
      action: input.action,
      content: input.content,
      selection: input.selection,
      targetText: input.targetText,
      actionType: input.actionType,
      language: input.language
    };
  },
  {
    name: "tiptap_ai",
    description: "Use this tool to deliver AI-generated content that should be applied to the Tiptap document editor. This tool formats responses for direct integration with the editor.",
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Rewrite', 'Grammar correction', 'Translation')"),
      content: z.string().describe("The AI-generated HTML content to be applied to the editor"),
      selection: z.object({
        from: z.number(),
        to: z.number(),
        text: z.string()
      }).optional().describe("The original text selection that was modified"),
      targetText: z.string().optional().describe("The original text that was being modified"),
      actionType: z.enum(['rewrite', 'correct', 'expand', 'translate', 'summarize', 'outline', 'insert']).describe("The type of action performed"),
      language: z.string().optional().describe("Target language for translation actions")
    })
  }
);

// Memory management tools (simplified version since langmem isn't available in NPM)
const memoryStore = new Map<string, Array<{ content: string; timestamp: number; type: string }>>();

const createMemoryTool = tool(
  async (input: { content: string; type?: string; sessionId?: string }) => {
    const sessionId = input.sessionId || "default";
    const memory = {
      content: input.content,
      timestamp: Date.now(),
      type: input.type || "general"
    };
    
    if (!memoryStore.has(sessionId)) {
      memoryStore.set(sessionId, []);
    }
    
    const memories = memoryStore.get(sessionId)!;
    memories.push(memory);
    
    // Keep only last 50 memories per session
    if (memories.length > 50) {
      memories.splice(0, memories.length - 50);
    }
    
    return `Memory stored: ${input.content}`;
  },
  {
    name: "store_memory",
    description: "Store information in memory for future reference",
    schema: z.object({
      content: z.string().describe("The content to remember"),
      type: z.string().optional().describe("Type of memory (e.g., 'preference', 'fact', 'context')"),
      sessionId: z.string().optional().describe("Session ID for memory isolation")
    })
  }
);

const searchMemoryTool = tool(
  async (input: { query: string; sessionId?: string; limit?: number }) => {
    const sessionId = input.sessionId || "default";
    const memories = memoryStore.get(sessionId) || [];
    const limit = input.limit || 10;
    
    // Simple keyword search
    const queryLower = input.query.toLowerCase();
    const relevantMemories = memories
      .filter(memory => memory.content.toLowerCase().includes(queryLower))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    if (relevantMemories.length === 0) {
      return "No relevant memories found.";
    }
    
    return JSON.stringify({
      memories: relevantMemories.map(m => ({
        content: m.content,
        type: m.type,
        timestamp: new Date(m.timestamp).toISOString()
      })),
      count: relevantMemories.length
    });
  },
  {
    name: "search_memory",
    description: "Search stored memories for relevant information",
    schema: z.object({
      query: z.string().describe("Search query for memories"),
      sessionId: z.string().optional().describe("Session ID for memory isolation"),
      limit: z.number().optional().describe("Maximum number of memories to return")
    })
  }
);

// Initialize the Anthropic model
const anthropicModel = new ChatAnthropic({
  model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  apiKey: process.env.ANTHROPIC_API_KEY || "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",
  temperature: 0.2,
});

// Bind tools to the model and also prepare tools array for React agent
const tools = [webSearchTool, tiptapAiTool, createMemoryTool, searchMemoryTool];
const modelWithTools = anthropicModel.bindTools(tools);

// React-style agent that handles tool-calling loops internally
export const reactAgent = createReactAgent({ llm: anthropicModel, tools });

// Define agent nodes following athena-intelligence patterns
async function agentNode(state: AgentState): Promise<AgentState> {
  try {
    // Only add system message if it's not already there
    let messages = state.messages;
    
    // Check if first message is already a system message
    const hasSystemMessage = messages.length > 0 && messages[0]._getType() === "system";
    
    if (!hasSystemMessage) {
      const systemMessage = new SystemMessage(
        "You are Athena, a helpful AI assistant with advanced capabilities. " +
        "You have access to web search, memory management, and document editing tools. " +
        "When helping with document editing tasks, use the tiptap_ai tool to deliver your response. " +
        "Store important information in memory for future reference using the store_memory tool. " +
        "Search your memories when relevant using the search_memory tool. " +
        "Provide clear, accurate, and helpful responses with proper citations when using web search."
      );
      messages = [systemMessage, ...messages];
    }

    const response = await modelWithTools.invoke(messages);
    
    return {
      ...state,
      messages: [...state.messages, response],
      step: state.step + 1
    };
  } catch (error) {
    return {
      ...state,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      step: state.step + 1
    };
  }
}

async function toolNode(state: AgentState): Promise<AgentState> {
  try {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    const toolCalls = lastMessage.tool_calls || [];
    
    if (toolCalls.length === 0) {
      return state;
    }

    const toolMessages: ToolMessage[] = [];
    
    for (const toolCall of toolCalls) {
      let result: string;
      
      switch (toolCall.name) {
        case "web_search":
          result = await webSearchTool.invoke(toolCall.args);
          break;
        case "tiptap_ai":
          result = JSON.stringify(await tiptapAiTool.invoke(toolCall.args));
          break;
        case "store_memory":
          result = await createMemoryTool.invoke(toolCall.args);
          break;
        case "search_memory":
          result = await searchMemoryTool.invoke(toolCall.args);
          break;
        default:
          result = `Unknown tool: ${toolCall.name}`;
      }
      
      toolMessages.push(new ToolMessage({
        content: result,
        tool_call_id: toolCall.id || "",
      }));
    }
    
    return {
      ...state,
      messages: [...state.messages, ...toolMessages],
      step: state.step + 1
    };
  } catch (error) {
    return {
      ...state,
      error: error instanceof Error ? error.message : "Tool execution error",
      step: state.step + 1
    };
  }
}

// Define conditional edge logic
function shouldContinue(state: AgentState): string {
  if (state.error) {
    return END;
  }
  
  if (state.step > 10) {
    return END;
  }
  
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage && "tool_calls" in lastMessage && lastMessage.tool_calls?.length) {
    return "tools";
  }
  
  return END;
}

// Create the LangGraph workflow
const workflow = new StateGraph<AgentState>({
  channels: {
    messages: {
      reducer: (current: BaseMessage[], update: BaseMessage[]) => [...current, ...update],
      default: () => []
    },
    step: {
      reducer: (current: number, update: number) => update,
      default: () => 0
    },
    error: {
      reducer: (current: string | undefined, update: string | undefined) => update,
      default: () => undefined
    }
  }
})
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END
  })
  .addEdge("tools", "agent");

// Compile the graph
export const langGraphAgent = workflow.compile();

// Export utility functions
export function createInitialState(messages: BaseMessage[]): AgentState {
  return {
    messages,
    step: 0
  };
}

export { webSearchTool, tiptapAiTool, createMemoryTool, searchMemoryTool };
