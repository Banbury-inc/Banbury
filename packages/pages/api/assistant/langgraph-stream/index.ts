import type { NextApiRequest, NextApiResponse } from "next"
import { SystemMessage, ChatMessage } from "@langchain/core/messages"
import { createReactAgentForProvider, createDocumentAgentForProvider, createPlanningAgentForProvider, createAskAgentForProvider } from "./agent/agent"
import { runWithServerContext } from "../../../../frontend/assistant/langraph/serverContext"
import type { StreamRequestBody } from "./types"
import { API_CONFIG, getLangGraphPrompts } from "./constants"
import { PLANNER_SYSTEM_PROMPT } from "../planner-stream/constants"
import { normalizeMessages } from "./handlers/normalizeMessages"
import { enrichWithDocumentContext } from "./handlers/enrichWithDocumentContext"
import { downloadFiles } from "./handlers/downloadFiles"
import { toLangChainMessages } from "./handlers/toLangChainMessages"
import { normalizeToolPreferences } from "./handlers/normalizeToolPreferences"
import { processStreamChunk } from "./handlers/processStreamChunk/processStreamChunk"
import { parseErrorMessage } from "./handlers/parseErrorMessage"
import { detectDocumentRequest } from "../claude-skills-stream/handlers/detectDocumentRequest"
// NOTE: Claude Skills routing removed - document requests now use local pptxgenjs-based generation

export const config = API_CONFIG

interface CurrentCodeFileContext {
  filePath: string
  fileName?: string
  content?: string
}

const CODE_FILE_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".cs", ".php", ".rb", ".go", ".rs",
  ".swift", ".kt", ".html", ".css", ".scss", ".sass", ".less", ".json", ".xml", ".yaml", ".yml",
  ".md", ".sql", ".sh", ".bash", ".vue", ".svelte", ".r", ".m", ".pl", ".lua", ".dart", ".elm",
  ".clj", ".hs", ".fs", ".vb", ".asm", ".s", ".coffee", ".litcoffee", ".iced",
]

function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `lg-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createErrorDiagnostics(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  return {
    message,
    name: error instanceof Error ? error.name : "UnknownError",
    stack: process.env.NODE_ENV === "production" ? undefined : stack,
  }
}

function isCodeFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return CODE_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function inferCurrentCodeFileFromMessages(messages: any[]): CurrentCodeFileContext | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!Array.isArray(message?.content)) continue

    const fileAttachmentParts = message.content.filter((part: any) => part?.type === "file-attachment")
    for (let j = fileAttachmentParts.length - 1; j >= 0; j--) {
      const part = fileAttachmentParts[j]
      const filePath = typeof part?.filePath === "string" ? part.filePath : ""
      const fileName = typeof part?.fileName === "string" ? part.fileName : ""
      if (!filePath || !fileName) continue
      if (!isCodeFileName(fileName)) continue

      return {
        filePath,
        fileName,
      }
    }
  }

  return undefined
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = createRequestId()
  res.setHeader("X-Request-Id", requestId)

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    res.status(405).end()
    return
  }

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("X-Accel-Buffering", "no")
  // Do not set "Connection" header on HTTP/2; it causes protocol errors
  
  // Handle client disconnect
  req.on("close", () => {
    if (!res.writableEnded) {
      res.end()
    }
  })

  const send = (event: any) => {
    if (!res.writableEnded) {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      } catch (writeError) {
        // Connection may have closed, silently fail
        console.error("Stream write error:", writeError)
      }
    }
  }

  try {
    const prompts = getLangGraphPrompts()
    const body = req.body as StreamRequestBody
    const effectiveCurrentCodeFile = body.currentCodeFile || inferCurrentCodeFileFromMessages(body.messages || [])
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    // Normalize messages
    let processedMessages = normalizeMessages({ messages: body.messages })
    console.log('processedMessages', processedMessages)
    
    // Add document context
    processedMessages = enrichWithDocumentContext({ 
      messages: processedMessages, 
      documentContext: body.documentContext 
    })
    console.log('processedMessages after enrichWithDocumentContext', processedMessages)
    // Pre-download files from S3
    const messagesWithFileData = await downloadFiles({ 
      messages: processedMessages, 
      authToken: token 
    })
    console.log('messagesWithFileData', messagesWithFileData)
    // Normalize tool preferences before message conversion
    const normalizedToolPreferences = normalizeToolPreferences({ toolPreferences: body.toolPreferences })
    const modelProvider = normalizedToolPreferences.model_provider === "openai" ? "openai" : normalizedToolPreferences.model_provider === "google" ? "google" : "anthropic"
    // Detect if this is a document-related request (will be used to select appropriate system prompt)
    const isDocumentRequest = detectDocumentRequest(body.messages)
    console.log('isDocumentRequest', isDocumentRequest)
    // Convert to LangChain messages
    const lcMessages = toLangChainMessages(messagesWithFileData, modelProvider)
    console.log('lcMessages', lcMessages)
    // Only add system message if not already present
    let allMessages = lcMessages
    const hasSystemMessage = lcMessages.length > 0 && lcMessages[0]._getType() === "system"
    
    // Determine if plan mode is enabled (used for both system prompt and agent selection)
    // IMPORTANT: If planContext is present, we are EXECUTING a plan, so force plan mode OFF
    // to ensure the general agent with full tools is used for execution.
    const isPlanMode = normalizedToolPreferences.plan_mode === true && !body.planContext
    
    // Determine if ask mode is enabled (read-only exploration, only search tools)
    // Ask mode cannot be combined with plan mode - plan mode takes precedence
    const isAskMode = normalizedToolPreferences.ask_mode === true && !isPlanMode && !body.planContext
    
    if (!hasSystemMessage) {
      // Append date/time context (if provided) directly to the system prompt so the model always sees it
      const dateTimeSuffix = body.dateTimeContext
        ? `\n\nCurrent date and time: ${body.dateTimeContext.formatted}. ISO timestamp: ${body.dateTimeContext.isoString}`
        : ""
      
      // Build plan context suffix if executing within a plan
      let planContextSuffix = ""
      if (body.planContext) {
        const { planTitle, todos, currentTodoId, isSubAgent } = body.planContext
        const currentTodo = todos.find(t => t.id === currentTodoId)
        const todoList = todos.map(t => {
          const checkbox = t.status === "completed" ? "[x]" : "[ ]"
          const marker = t.id === currentTodoId ? " <- CURRENT TASK" : ""
          return `- ${checkbox} ${t.description} (${t.status})${marker}`
        }).join("\n")
        
        planContextSuffix = `\n\n## Plan Context
You are ${isSubAgent ? "a sub-agent delegated to complete a specific task in" : "executing"} the plan: "${planTitle}"

### Current Task
${currentTodo?.description || "Unknown task"}

### All Plan Tasks
${todoList}

Focus on completing your current task thoroughly. ${isSubAgent ? "You are working in parallel with other sub-agents on different tasks." : "Execute each task in sequence."}`
      }

      // Add currently open code file context so code-edit tools can be used reliably.
      let codeFileContextSuffix = ""
      if (effectiveCurrentCodeFile?.filePath) {
        const fileName = effectiveCurrentCodeFile.fileName || effectiveCurrentCodeFile.filePath.split("/").pop() || "unknown"
        const codePreview = typeof effectiveCurrentCodeFile.content === "string"
          ? effectiveCurrentCodeFile.content.slice(0, 12000)
          : ""

        codeFileContextSuffix =
          `\n\n## Current Open Code File\n` +
          `- fileName: ${fileName}\n` +
          `- filePath: ${effectiveCurrentCodeFile.filePath}\n` +
          `\nThe user is focused on this IDE code file. For ANY edit to this file, you MUST call code_edit_open_file with filePath exactly as above and snippet-based edits. ` +
          `Do NOT use docx_ai, sheet_ai, or other document tools for this path — those apply only to Office documents in their viewers, not to source code.` +
          (codePreview
            ? `\n\n### Open File Content (preview)\n\`\`\`\n${codePreview}\n\`\`\``
            : "")
      }
      
      // Use appropriate system prompt based on mode:
      // 1. Ask mode: Use ask mode prompt for read-only exploration
      // 2. Plan mode: Use planner prompt to generate comprehensive implementation plans
      // 3. Document request: Use document-specialized prompt
      // 4. Default: Use general assistant prompt
      let basePrompt: string
      if (isAskMode) {
        basePrompt = prompts.askModeSystemPrompt
      } else if (isPlanMode) {
        basePrompt = PLANNER_SYSTEM_PROMPT
      } else if (isDocumentRequest) {
        basePrompt = prompts.documentSystemPrompt
      } else {
        basePrompt = prompts.systemPrompt
      }
      const systemText = basePrompt + dateTimeSuffix + planContextSuffix + codeFileContextSuffix
      // Google's API doesn't support SystemMessage - convert to ChatMessage for Google provider
      if (modelProvider === "google") {
        const systemAsUserMessage = new ChatMessage({ content: `System: ${systemText}`, role: "human" })
        allMessages = [systemAsUserMessage, ...lcMessages]
      } else {
        const systemMessage = new SystemMessage(systemText)
        allMessages = [systemMessage, ...lcMessages]
      }
    }
    
    // Start assistant message
    send({ type: "message-start", role: "assistant" })

    // Seed todos from planContext if executing a plan
    const threadId = body.threadId || `ephemeral-${Date.now()}`
    if (body.planContext && body.planContext.todos.length > 0) {
      // Send todo-list-init event with plan todos
      const planTodos = body.planContext.todos.map(t => ({
        id: t.id,
        description: t.description,
        status: t.status,
        source: "plan" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      send({
        type: "todo-list-init",
        threadId,
        todos: planTodos,
        activeTodoId: body.planContext.currentTodoId || null,
      })
    }

    // Prefer the prebuilt React agent streaming to manage tool loops
    let finalResult: any = null

    // Run the agent with server context so tools can access the auth token, send function, and todo context
    try {
      await runWithServerContext({
        authToken: token,
        toolPreferences: normalizedToolPreferences,
        dateTimeContext: body.dateTimeContext,
        documentContext: body.documentContext,
        presentationContext: body.presentationContext,
        currentCodeFile: effectiveCurrentCodeFile,
        webSearchDefaults: body.webSearchOptions || {},
        // Todo middleware context
        sendEvent: send,
        threadId,
        planContext: body.planContext,
      }, async () => {
        // Select agent based on mode:
        // 1. Ask mode: Read-only search tools for exploration
        // 2. Plan mode: Read-only tools for researching and creating plans
        // 3. Document request: Document-specialized tools
        // 4. Default: Full tool access
        let reactAgent
        let agentType: "asking" | "planning" | "document" | "general"
        if (isAskMode) {
          reactAgent = createAskAgentForProvider(modelProvider)
          agentType = "asking"
        } else if (isPlanMode) {
          reactAgent = createPlanningAgentForProvider(modelProvider)
          agentType = "planning"
        } else if (isDocumentRequest) {
          reactAgent = createDocumentAgentForProvider(modelProvider)
          agentType = "document"
        } else {
          const excludeDocxWhenCodeFocused = Boolean(effectiveCurrentCodeFile?.filePath)
          reactAgent = createReactAgentForProvider(modelProvider, {
            excludeToolNames: excludeDocxWhenCodeFocused ? ["docx_ai"] : undefined,
          })
          agentType = "general"
        }
        
        // Send agent type event to UI for user feedback
        send({ 
          type: "agent-type", 
          agentType,
          agentLabel: agentType === "asking" ? "Ask Agent" :
                      agentType === "planning" ? "Planning Agent" : 
                      agentType === "document" ? "Document Agent" : 
                      "General Agent",
          description: agentType === "asking" ? "Read-only exploration and research (no modifications)" :
                       agentType === "planning" ? "Researching and creating plan (read-only mode)" :
                       agentType === "document" ? "Specialized for document creation and editing" :
                       "Full capabilities enabled"
        })
        
        // For the general agent with middleware, extract and pass system prompt separately
        let messagesToStream = allMessages
        console.log('allMessages', allMessages)
        let systemPrompt: string | undefined = undefined
        
        if (agentType === "general") {
          // Extract system message if present
          const firstMessage = allMessages[0]
          if (firstMessage && firstMessage._getType() === "system") {
            systemPrompt = typeof firstMessage.content === "string" ? firstMessage.content : ""
            // Remove system message from messages array for middleware-based agent
            messagesToStream = allMessages.slice(1)
          }
        }
        console.log('messagesToStream', messagesToStream)
        
        // Use a custom streaming approach for character-by-character updates
        const stream = await reactAgent.stream(
          systemPrompt ? { messages: messagesToStream, prompt: systemPrompt } : { messages: messagesToStream }, 
          { 
            streamMode: "values",
            recursionLimit: body.recursionLimit || 25 // Use recursion limit from request or default to 25 to prevent infinite loops
          }
        )

      // Track processed content to avoid sending duplicate text
      const processedAiMessages = new Set<string>()
      // Track tool execution status
      let currentToolExecution: any = null
      // Track processed tool calls to avoid duplicates
      const processedToolCalls = new Set<string>()
      // Track tool executions by ID to correctly map results
      const toolExecutionMap = new Map<string, any>()

        for await (const chunk of stream) {
          const result = await processStreamChunk({
            chunk,
            allMessages: messagesToStream,
            processedAiMessages,
            processedToolCalls,
            currentToolExecution,
            toolExecutionMap,
            send,
            threadId
          })
          
          currentToolExecution = result.currentToolExecution
          finalResult = result.finalResult
      }
    })
    } catch (graphError) {
      // LangGraph execution error
      
      // Stream detailed error information
      const errorMessage = graphError instanceof Error ? graphError.message : "Graph execution failed"
      console.error("langgraph-stream graph error", {
        requestId,
        ...createErrorDiagnostics(graphError),
      })
      send({ type: "error", error: errorMessage, requestId })
      
      // Stream error details for debugging
      if (graphError instanceof Error && graphError.stack) {
        send({ type: "error-details", stack: graphError.stack, requestId })
      }
      
      res.end()
      return
    }

    // Send completion with detailed status
    send({ type: "message-end", status: { type: "complete", reason: "stop" } })
    
    // Stream final summary
    const totalSteps = finalResult?.messages?.length || 0
    const toolCalls = finalResult?.messages?.filter((m: any) => m._getType?.() === "tool") || []
    const aiMessages = finalResult?.messages?.filter((m: any) => m._getType?.() === "ai") || []
    const allToolNames = aiMessages.flatMap((m: any) => 
      (m.tool_calls || []).map((tc: any) => tc.name)
    )
    const uniqueTools = Array.from(new Set(allToolNames))
    
    send({ 
      type: "completion-summary", 
      totalSteps, 
      toolExecutions: toolCalls.length,
      toolsUsed: uniqueTools
    })
    
    // Update step progression to show completion
    if (totalSteps > 0) {
      send({ type: "step-progression", step: totalSteps, totalSteps })
    }
    
    // Try to extract and emit token usage from the final AI message
    // LangChain stores usage in response_metadata or additional_kwargs depending on provider
    try {
      const lastAiMessage = aiMessages[aiMessages.length - 1]
      if (lastAiMessage) {
        // Check multiple possible locations for token usage
        const responseMetadata = lastAiMessage.response_metadata || {}
        const additionalKwargs = lastAiMessage.additional_kwargs || {}
        const usage = responseMetadata.usage || additionalKwargs.usage || {}
        
        // Anthropic format: input_tokens, output_tokens
        // OpenAI format: prompt_tokens, completion_tokens, total_tokens
        const inputTokens = usage.input_tokens || usage.prompt_tokens || 0
        const outputTokens = usage.output_tokens || usage.completion_tokens || 0
        const totalTokens = usage.total_tokens || (inputTokens + outputTokens)
        
        if (inputTokens > 0 || outputTokens > 0) {
          send({
            type: "token-usage",
            inputTokens,
            outputTokens,
            totalTokens,
            model: normalizedToolPreferences.model_id || normalizedToolPreferences.model_provider,
          })
          
          // Track token usage in cloud backend for usage limits
          if (token && totalTokens > 0) {
            const backendUrl = process.env.CLOUD_BACKEND_URL || 'https://www.api.dev.banbury.io'
            fetch(`${backendUrl}/users/track_token_usage/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                total_tokens: totalTokens,
                model: normalizedToolPreferences.model_id || normalizedToolPreferences.model_provider
              })
            }).catch(() => {
              // Silently ignore tracking errors - non-critical
            })
          }
        }
      }
    } catch {
      // Ignore token usage extraction errors - it's optional
    }
    
    send({ type: "done" })
    res.end()

  } catch (e: any) {
    const errorMessage = parseErrorMessage({ error: e })
    const diagnostics = createErrorDiagnostics(e)
    console.error("langgraph-stream request error", {
      requestId,
      ...diagnostics,
    })
    send({
      type: "error",
      error: errorMessage,
      requestId,
      details: diagnostics.message,
    })
    res.end()
  }
}
