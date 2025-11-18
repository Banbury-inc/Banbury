import type { NextApiRequest, NextApiResponse } from "next"
import { SystemMessage } from "@langchain/core/messages"
import { createReactAgentForProvider } from "./agent/agent"
import { runWithServerContext } from "../../../../frontend/assistant/langraph/serverContext"
import type { StreamRequestBody } from "./types"
import { SYSTEM_PROMPT, API_CONFIG } from "./constants"
import { normalizeMessages } from "./handlers/normalizeMessages"
import { enrichWithDocumentContext } from "./handlers/enrichWithDocumentContext"
import { downloadFiles } from "./handlers/downloadFiles"
import { toLangChainMessages } from "./handlers/toLangChainMessages"
import { normalizeToolPreferences } from "./handlers/normalizeToolPreferences"
import { processStreamChunk } from "./handlers/processStreamChunk"
import { parseErrorMessage } from "./handlers/parseErrorMessage"

export const config = API_CONFIG

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    res.status(405).end()
    return
  }

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  // Do not set "Connection" header on HTTP/2; it causes protocol errors

  const send = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  try {
    const body = req.body as StreamRequestBody
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    // Normalize messages
    let processedMessages = normalizeMessages({ messages: body.messages })
    
    // Add document context
    processedMessages = enrichWithDocumentContext({ 
      messages: processedMessages, 
      documentContext: body.documentContext 
    })
    
    // Pre-download files from S3
    const messagesWithFileData = await downloadFiles({ 
      messages: processedMessages, 
      authToken: token 
    })

    // Normalize tool preferences before message conversion
    const normalizedToolPreferences = normalizeToolPreferences({ toolPreferences: body.toolPreferences })
    const modelProvider = normalizedToolPreferences.model_provider === "openai" ? "openai" : "anthropic"

    // Convert to LangChain messages
    const lcMessages = toLangChainMessages(messagesWithFileData, modelProvider)
    
    // Only add system message if not already present
    let allMessages = lcMessages
    const hasSystemMessage = lcMessages.length > 0 && lcMessages[0]._getType() === "system"
    
    if (!hasSystemMessage) {
      // Append date/time context (if provided) directly to the system prompt so the model always sees it
      const dateTimeSuffix = body.dateTimeContext
        ? `\n\nCurrent date and time: ${body.dateTimeContext.formatted}. ISO timestamp: ${body.dateTimeContext.isoString}`
        : ""
      const systemText = SYSTEM_PROMPT + dateTimeSuffix
      const systemMessage = new SystemMessage(systemText)
      allMessages = [systemMessage, ...lcMessages]
    }
    
    // Start assistant message
    send({ type: "message-start", role: "assistant" })

    // Prefer the prebuilt React agent streaming to manage tool loops
    let finalResult: any = null

    // Run the agent with server context so tools can access the auth token
    try {
      await runWithServerContext({ 
        authToken: token, 
        toolPreferences: normalizedToolPreferences,
        dateTimeContext: body.dateTimeContext,
        documentContext: body.documentContext,
        webSearchDefaults: body.webSearchOptions || {}
      }, async () => {
        const reactAgent = createReactAgentForProvider(modelProvider)
        // Use a custom streaming approach for character-by-character updates
        const stream = await reactAgent.stream(
          { messages: allMessages }, 
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

        for await (const chunk of stream) {
          const result = await processStreamChunk({
            chunk,
            allMessages,
            processedAiMessages,
            processedToolCalls,
            currentToolExecution,
            send
          })
          
          currentToolExecution = result.currentToolExecution
          finalResult = result.finalResult
      }
    })
    } catch (graphError) {
      // LangGraph execution error
      
      // Stream detailed error information
      const errorMessage = graphError instanceof Error ? graphError.message : "Graph execution failed"
      send({ type: "error", error: errorMessage })
      
      // Stream error details for debugging
      if (graphError instanceof Error && graphError.stack) {
        send({ type: "error-details", stack: graphError.stack })
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
    
    send({ type: "done" })
    res.end()

  } catch (e: any) {
    const errorMessage = parseErrorMessage({ error: e })
    send({ type: "error", error: errorMessage })
    res.end()
  }
}
