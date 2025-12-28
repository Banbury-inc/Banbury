import type { NextApiRequest, NextApiResponse } from "next"
import { SystemMessage, HumanMessage, ChatMessage } from "@langchain/core/messages"
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/81bfc7ff-c606-49ea-8884-64cce2b9a365',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:51',message:'Raw toolPreferences from request',data:{rawToolPreferences:body.toolPreferences},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const normalizedToolPreferences = normalizeToolPreferences({ toolPreferences: body.toolPreferences })
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/81bfc7ff-c606-49ea-8884-64cce2b9a365',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:53',message:'Normalized toolPreferences after normalization',data:{normalizedToolPreferences},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const modelProvider = normalizedToolPreferences.model_provider === "openai" ? "openai" : normalizedToolPreferences.model_provider === "google" ? "google" : "anthropic"
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/81bfc7ff-c606-49ea-8884-64cce2b9a365',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:56',message:'Model provider determination',data:{normalizedProvider:normalizedToolPreferences.model_provider,determinedProvider:modelProvider,modelId:normalizedToolPreferences.model_id},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Convert to LangChain messages
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/81bfc7ff-c606-49ea-8884-64cce2b9a365',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:65',message:'Before toLangChainMessages call',data:{modelProvider,messagesCount:messagesWithFileData.length,firstMessageRole:messagesWithFileData[0]?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'author-error',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const lcMessages = toLangChainMessages(messagesWithFileData, modelProvider)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/81bfc7ff-c606-49ea-8884-64cce2b9a365',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:66',message:'After toLangChainMessages call',data:{lcMessagesCount:lcMessages.length,firstLcMessageType:lcMessages[0]?._getType?.()},timestamp:Date.now(),sessionId:'debug-session',runId:'author-error',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Only add system message if not already present
    let allMessages = lcMessages
    const hasSystemMessage = lcMessages.length > 0 && lcMessages[0]._getType() === "system"
    
    if (!hasSystemMessage) {
      // Append date/time context (if provided) directly to the system prompt so the model always sees it
      const dateTimeSuffix = body.dateTimeContext
        ? `\n\nCurrent date and time: ${body.dateTimeContext.formatted}. ISO timestamp: ${body.dateTimeContext.isoString}`
        : ""
      const systemText = SYSTEM_PROMPT + dateTimeSuffix
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/81bfc7ff-c606-49ea-8884-64cce2b9a365',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:87',message:'Before createReactAgentForProvider',data:{modelProvider,allMessagesCount:allMessages.length,firstMessageType:allMessages[0]?._getType?.()},timestamp:Date.now(),sessionId:'debug-session',runId:'author-error',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const reactAgent = createReactAgentForProvider(modelProvider)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/81bfc7ff-c606-49ea-8884-64cce2b9a365',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:89',message:'After createReactAgentForProvider, before stream',data:{modelProvider},timestamp:Date.now(),sessionId:'debug-session',runId:'author-error',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Use a custom streaming approach for character-by-character updates
        // #region agent log
        const messageTypes = allMessages.map(m => m._getType?.())
        const messageDetails = allMessages.map(m => ({
          type: m._getType?.(),
          typeProperty: (m as any).type,
          contentType: typeof m.content === 'string' ? 'string' : 'complex',
          contentPreview: typeof m.content === 'string' ? m.content.substring(0, 100) : 'complex',
          hasAdditionalKwargs: !!m.additional_kwargs,
          additionalKwargsKeys: m.additional_kwargs ? Object.keys(m.additional_kwargs) : [],
          authorValue: m.additional_kwargs?.author,
          fullAdditionalKwargs: m.additional_kwargs,
          messageClass: m.constructor.name
        }))
        fetch('http://127.0.0.1:7242/ingest/81bfc7ff-c606-49ea-8884-64cce2b9a365',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:104',message:'Before stream call - message details',data:{modelProvider,allMessagesCount:allMessages.length,messageTypes,messageDetails},timestamp:Date.now(),sessionId:'debug-session',runId:'author-error-v3',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
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
      // #region agent log
      const errorDetails = graphError instanceof Error ? {
        message: graphError.message,
        stack: graphError.stack,
        name: graphError.name,
        cause: (graphError as any).cause
      } : { error: String(graphError) }
      fetch('http://127.0.0.1:7242/ingest/81bfc7ff-c606-49ea-8884-64cce2b9a365',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:118',message:'Graph execution error caught',data:{errorDetails,normalizedToolPreferences,modelProvider,allMessagesSnapshot:allMessages.map(m=>({type:m._getType?.(),contentType:typeof m.content,hasAdditionalKwargs:!!m.additional_kwargs,additionalKwargsKeys:m.additional_kwargs?Object.keys(m.additional_kwargs):[]}))},timestamp:Date.now(),sessionId:'debug-session',runId:'author-error-v2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
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
        }
      }
    } catch {
      // Ignore token usage extraction errors - it's optional
    }
    
    send({ type: "done" })
    res.end()

  } catch (e: any) {
    const errorMessage = parseErrorMessage({ error: e })
    send({ type: "error", error: errorMessage })
    res.end()
  }
}
