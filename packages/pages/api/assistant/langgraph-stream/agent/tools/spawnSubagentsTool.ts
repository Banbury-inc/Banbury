/**
 * Spawn Subagents Tool
 * 
 * Allows the main agent to spawn multiple specialized subagents in parallel.
 * Each subagent has role-specific tools and system prompts.
 * 
 * This implements the LangChain "Subagents as Tools" pattern:
 * https://docs.langchain.com/oss/javascript/langchain/multi-agent
 */

import { tool } from "@langchain/core/tools"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { SystemMessage, HumanMessage } from "@langchain/core/messages"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"
import {
  SpawnSubagentsInputSchema,
  ROLE_TOOL_ALLOWLISTS,
  ROLE_SYSTEM_PROMPTS,
  DEFAULT_SUBAGENT_OPTIONS,
  validateSpawnInput,
  type SpawnSubagentsInput,
  type SubagentSpec,
  type SubagentResult,
  type SpawnSubagentsOutput,
  type SubagentRole,
  type SubagentOptions,
} from "../subagents/subagentTypes"

// Import all available tools for filtering
import { webSearchTool } from "./webSearchTool"
import { searchFilesTool } from "./searchFilesTool"
import { searchMemoryTool } from "./searchMemoryTool"
import { createFileTool } from "./createFileTool"
import { createFolderTool } from "./createFolderTool"
import { writeWorkspaceFileTool } from "./writeWorkspaceFileTool"
import { executeScriptTool } from "./executeScriptTool"
import { downloadFromUrlTool } from "./downloadFromUrlTool"
import { generateImageTool } from "./generateImageTool"
import { getCurrentDateTimeTool } from "./getCurrentDateTimeTool"
import { docxAiTool } from "./docxAiTool"
import { sheetAiTool } from "./sheetAiTool"
import { pptxAiTool } from "./pptxAiTool"
import { tldrawAiTool } from "./tldrawAiTool"

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * Maps tool names to actual tool instances
 */
const TOOL_REGISTRY: Record<string, any> = {
  web_search: webSearchTool,
  search_files: searchFilesTool,
  search_memory: searchMemoryTool,
  create_file: createFileTool,
  create_folder: createFolderTool,
  write_workspace_file: writeWorkspaceFileTool,
  execute_script: executeScriptTool,
  download_from_url: downloadFromUrlTool,
  generate_image: generateImageTool,
  get_current_date_time: getCurrentDateTimeTool,
  docx_ai: docxAiTool,
  sheet_ai: sheetAiTool,
  pptx_ai: pptxAiTool,
  tldraw_ai: tldrawAiTool,
}

/**
 * Get tools for a specific role based on allowlist
 */
function getToolsForRole(role: SubagentRole): any[] {
  const allowedToolNames = ROLE_TOOL_ALLOWLISTS[role]
  return allowedToolNames
    .map(name => TOOL_REGISTRY[name])
    .filter(Boolean)
}

// ============================================================================
// Model Creation
// ============================================================================

type ModelProvider = "anthropic" | "openai" | "google"

function getDefaultModelForProvider(provider: ModelProvider): string {
  if (provider === "openai") return "gpt-4o-mini"
  if (provider === "google") return "gemini-2.0-flash-exp"
  return "claude-sonnet-4-20250514"
}

function createChatModel(provider: ModelProvider, modelId?: string) {
  const actualModelId = modelId || getDefaultModelForProvider(provider)
  
  if (provider === "openai") {
    return new ChatOpenAI({
      model: actualModelId,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
    })
  }

  if (provider === "google") {
    return new ChatGoogleGenerativeAI({
      model: actualModelId,
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.2,
    })
  }

  return new ChatAnthropic({
    model: actualModelId,
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.2,
    invocationKwargs: { top_p: undefined },
  })
}

// ============================================================================
// Subagent Execution
// ============================================================================

/**
 * Execute a single subagent with timeout
 */
async function executeSubagent(
  spec: SubagentSpec,
  provider: ModelProvider,
  modelId: string | undefined,
  options: Required<SubagentOptions>,
  sendEvent: ((event: any) => void) | undefined
): Promise<SubagentResult> {
  const startTime = Date.now()
  const subagentId = spec.id

  // Emit subagent-start event
  sendEvent?.({
    type: "subagent-start",
    subagentId,
    role: spec.role,
    goal: spec.goal,
  })

  try {
    // Get role-specific tools and system prompt
    const tools = getToolsForRole(spec.role)
    const rolePrompt = ROLE_SYSTEM_PROMPTS[spec.role]

    // Build full system prompt
    const systemPrompt = `${rolePrompt}

## Your Current Goal
${spec.goal}

${spec.context ? `## Additional Context\n${spec.context}` : ""}`

    // Create the agent - use haiku for researcher role, otherwise use the provided model
    const roleSpecificModelId = spec.role === "researcher" && provider === "anthropic"
      ? "claude-3-5-haiku-20241022"
      : modelId
    const llm = createChatModel(provider, roleSpecificModelId)
    const agent = createReactAgent({ llm, tools })

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), options.timeoutMs)
    })

    // Run agent with timeout
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(spec.goal),
    ]

    // Track tools used
    const toolsUsed: string[] = []

    // Stream and collect results
    const agentPromise = (async () => {
      const stream = await agent.stream(
        { messages },
        { 
          streamMode: "values",
          recursionLimit: options.recursionLimit,
        }
      )

      let finalMessages: any[] = []
      let processedMessageCount = messages.length
      
      for await (const chunk of stream) {
        finalMessages = (chunk as any).messages || []
        
        // Emit subagent content and tool events
        const newMessages = finalMessages.slice(processedMessageCount)
        for (const m of newMessages) {
          const type = m?._getType?.()
          
          if (type === "ai") {
            // Stream AI message content
            const content = (m as any).content
            const text = typeof content === "string" 
              ? content 
              : Array.isArray(content)
                ? content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("")
                : ""
            
            if (text && text.trim()) {
              // Send text delta with subagent context
              sendEvent?.({
                type: "subagent-content",
                subagentId,
                role: spec.role,
                text,
              })
            }
            
            const toolCalls = (m as any).tool_calls || []
            for (const tc of toolCalls) {
              if (tc?.name && !toolsUsed.includes(tc.name)) {
                toolsUsed.push(tc.name)
              }
              sendEvent?.({
                type: "subagent-tool-call-start",
                subagentId,
                role: spec.role,
                toolName: tc?.name,
                toolCallId: tc?.id,
                args: tc?.args || {},
                argsText: JSON.stringify(tc?.args || {}),
              })
            }
          } else if (type === "tool") {
            sendEvent?.({
              type: "subagent-tool-result",
              subagentId,
              role: spec.role,
              toolCallId: m.tool_call_id,
            })
          }
        }
        
        processedMessageCount = finalMessages.length
      }

      return finalMessages
    })()

    const finalMessages = await Promise.race([agentPromise, timeoutPromise])

    // Extract the final AI response
    const aiMessages = finalMessages.filter((m: any) => m?._getType?.() === "ai")
    const lastAiMessage = aiMessages[aiMessages.length - 1]
    const content = lastAiMessage?.content || ""
    const summary = typeof content === "string" 
      ? content 
      : Array.isArray(content) 
        ? content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("")
        : String(content)

    // Extract citations for researcher role
    const citations = spec.role === "researcher" 
      ? extractCitations(summary) 
      : undefined

    const result: SubagentResult = {
      id: subagentId,
      role: spec.role,
      status: "completed",
      summary,
      citations,
      durationMs: Date.now() - startTime,
      toolsUsed,
    }

    // Emit subagent-end event
    sendEvent?.({
      type: "subagent-end",
      subagentId,
      role: spec.role,
      status: "completed",
      durationMs: result.durationMs,
    })

    return result

  } catch (error: any) {
    const isTimeout = error?.message === "TIMEOUT"
    const result: SubagentResult = {
      id: subagentId,
      role: spec.role,
      status: isTimeout ? "timeout" : "failed",
      summary: "",
      error: isTimeout 
        ? `Subagent timed out after ${options.timeoutMs}ms` 
        : (error?.message || "Unknown error"),
      durationMs: Date.now() - startTime,
    }

    // Emit subagent-end event with failure
    sendEvent?.({
      type: "subagent-end",
      subagentId,
      role: spec.role,
      status: result.status,
      error: result.error,
      durationMs: result.durationMs,
    })

    return result
  }
}

/**
 * Extract URL citations from text
 */
function extractCitations(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g
  const matches = text.match(urlRegex) || []
  return [...new Set(matches)]
}

/**
 * Run subagents with concurrency control
 */
async function runSubagentsWithConcurrency(
  subagents: SubagentSpec[],
  provider: ModelProvider,
  modelId: string | undefined,
  options: Required<SubagentOptions>,
  sendEvent: ((event: any) => void) | undefined
): Promise<SubagentResult[]> {
  const results: SubagentResult[] = []
  const pending: SubagentSpec[] = [...subagents]
  const running: Promise<void>[] = []

  async function runNext(): Promise<void> {
    const spec = pending.shift()
    if (!spec) return

    const result = await executeSubagent(spec, provider, modelId, options, sendEvent)
    results.push(result)

    // Run next if any pending
    if (pending.length > 0) {
      await runNext()
    }
  }

  // Start initial batch up to maxConcurrency
  const initialBatch = Math.min(options.maxConcurrency, subagents.length)
  for (let i = 0; i < initialBatch; i++) {
    running.push(runNext())
  }

  // Wait for all to complete
  await Promise.all(running)

  return results
}

// ============================================================================
// Main Tool
// ============================================================================

export const spawnSubagentsTool = tool(
  async (input: SpawnSubagentsInput): Promise<string> => {
    const startTime = Date.now()

    // Get server context values
    const sendEvent = getServerContextValue<(event: any) => void>("sendEvent")
    const toolPreferences = getServerContextValue<any>("toolPreferences")
    
    // Determine model provider and ID
    const provider: ModelProvider = 
      toolPreferences?.model_provider === "openai" ? "openai" :
      toolPreferences?.model_provider === "google" ? "google" :
      "anthropic"
    const modelId = toolPreferences?.model_id

    // Validate input
    const validation = validateSpawnInput(input)
    if (!validation.valid) {
      const errorOutput: SpawnSubagentsOutput = {
        results: [],
        totalDurationMs: Date.now() - startTime,
        completedCount: 0,
        failedCount: input.subagents.length,
      }
      
      sendEvent?.({
        type: "subagent-spawn-error",
        errors: validation.errors,
      })

      return JSON.stringify({
        ...errorOutput,
        validationErrors: validation.errors,
      })
    }

    // Merge options with defaults
    const options: Required<SubagentOptions> = {
      ...DEFAULT_SUBAGENT_OPTIONS,
      ...input.options,
    }

    // Emit spawn-start event
    sendEvent?.({
      type: "subagent-spawn-start",
      subagentCount: input.subagents.length,
      roles: input.subagents.map(s => s.role),
      options,
    })

    // Execute subagents with concurrency control
    const results = await runSubagentsWithConcurrency(
      input.subagents,
      provider,
      modelId,
      options,
      sendEvent
    )

    // Build output
    const output: SpawnSubagentsOutput = {
      results,
      totalDurationMs: Date.now() - startTime,
      completedCount: results.filter(r => r.status === "completed").length,
      failedCount: results.filter(r => r.status !== "completed").length,
    }

    // Emit spawn-complete event
    sendEvent?.({
      type: "subagent-spawn-complete",
      completedCount: output.completedCount,
      failedCount: output.failedCount,
      totalDurationMs: output.totalDurationMs,
    })

    return JSON.stringify(output)
  },
  {
    name: "spawn_subagents",
    description: `Spawn multiple specialized AI subagents to work on tasks in parallel. Use this for complex tasks that benefit from parallel execution or specialized expertise.

**Available Roles:**
- **researcher**: Web search, summarization, citations (read-only)
- **codebase**: Search files/memory, analyze code (read-only)
- **planner**: Research and create implementation plans (read-only)
- **coder**: Full tools including file creation/editing (write-capable)
- **reviewer**: Read-only analysis, critique, risk assessment

**Constraints:**
- Maximum 6 subagents per call
- Only ONE write-capable role (coder) allowed per call
- Each subagent runs with a 2-minute timeout by default

**When to Use:**
- Complex research requiring multiple sources
- Tasks that benefit from different perspectives (research + review)
- Parallel implementation with code review
- Multi-step analysis requiring different expertise

**Example:**
\`\`\`json
{
  "subagents": [
    { "id": "research-1", "role": "researcher", "goal": "Find best practices for React authentication" },
    { "id": "codebase-1", "role": "codebase", "goal": "Analyze current auth implementation in the project" },
    { "id": "review-1", "role": "reviewer", "goal": "Review the findings and identify gaps" }
  ]
}
\`\`\``,
    schema: SpawnSubagentsInputSchema,
  }
)
