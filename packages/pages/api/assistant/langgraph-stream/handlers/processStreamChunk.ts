interface ProcessStreamChunkParams {
  chunk: any
  allMessages: any[]
  processedAiMessages: Set<string>
  processedToolCalls: Set<string>
  currentToolExecution: any
  send: (event: any) => void
}

interface ProcessStreamChunkResult {
  currentToolExecution: any
  finalResult: any
}

const TOOL_STATUS_MESSAGES: Record<string, string> = {
  web_search: "Searching the web...",
  tiptap_ai: "Processing document content...",
  sheet_ai: "Processing spreadsheet edits...",
  store_memory: "Storing information in memory...",
  search_memory: "Searching memory...",
  create_file: "Creating file..."
}

const TOOL_COMPLETION_MESSAGES: Record<string, string> = {
  web_search: "Web search completed",
  tiptap_ai: "Document processing completed",
  sheet_ai: "Spreadsheet edits ready",
  store_memory: "Memory stored successfully",
  search_memory: "Memory search completed",
  create_file: "File created successfully"
}

function getToolStatusMessage(toolName: string): string {
  if (TOOL_STATUS_MESSAGES[toolName]) return TOOL_STATUS_MESSAGES[toolName]
  if (toolName.startsWith('gmail_')) return 'Accessing Gmail…'
  return `Executing ${toolName}...`
}

function getToolCompletionMessage(toolName: string): string {
  if (TOOL_COMPLETION_MESSAGES[toolName]) return TOOL_COMPLETION_MESSAGES[toolName]
  if (toolName.startsWith('gmail_')) return 'Gmail operation completed'
  return `${toolName} completed`
}

async function streamTextContent(text: string, send: (event: any) => void): Promise<void> {
  const words = text.split(' ')
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const space = i < words.length - 1 ? ' ' : ''
    const chunk = word + space
    
    // Send the chunk immediately for real-time streaming
    send({ type: "text-delta", text: chunk })
    
    // Small delay between chunks for natural reading pace
    if (i < words.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 20)) // 20ms delay between words
    }
  }
}

async function processAiMessage(
  message: any,
  messageId: string,
  processedAiMessages: Set<string>,
  processedToolCalls: Set<string>,
  currentToolExecution: any,
  send: (event: any) => void
): Promise<any> {
  // Only process this AI message if we haven't seen it before
  if (processedAiMessages.has(messageId)) return currentToolExecution
  
  processedAiMessages.add(messageId)
  
  const toolCalls = (message as any).tool_calls || (message as any).additional_kwargs?.tool_calls || []
  const content: any = (message as any).content
  const fullText = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("")
      : ""
  
  // Stream the text character by character for better UX
  if (fullText && fullText.trim()) {
    await streamTextContent(fullText.trim(), send)
  }

  // Stream tool calls (avoid duplicates)
  let updatedToolExecution = currentToolExecution
  
  for (const toolCall of toolCalls) {
    if (processedToolCalls.has(toolCall.id)) continue
    
    processedToolCalls.add(toolCall.id)

    if (!toolCall?.name) {
      throw new Error("Received tool call without a tool name")
    }
    
    // Send tool call start event
    send({
      type: "tool-call-start",
      part: {
        type: "tool-call",
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        args: toolCall.args,
        argsText: JSON.stringify(toolCall.args, null, 2),
      },
    })
    
    // Stream tool-specific status messages
    const statusMessage = getToolStatusMessage(toolCall.name)
    send({ type: "tool-status", tool: toolCall.name, message: statusMessage })
    
    // Track current tool execution
    updatedToolExecution = toolCall
  }
  
  return updatedToolExecution
}

function processToolMessage(
  message: any,
  currentToolExecution: any,
  send: (event: any) => void
): void {
  // Send tool execution completion event
  send({
    type: "tool-result",
    part: {
      type: "tool-result",
      toolCallId: message.tool_call_id || "",
      toolName: currentToolExecution?.name || "unknown",
      result: message.content,
    },
  })
  
  // Stream tool completion status
  if (currentToolExecution?.name) {
    const completionMessage = getToolCompletionMessage(currentToolExecution.name)
    send({ type: "tool-completion", tool: currentToolExecution.name, message: completionMessage })
  }
}

export async function processStreamChunk({
  chunk,
  allMessages,
  processedAiMessages,
  processedToolCalls,
  currentToolExecution,
  send
}: ProcessStreamChunkParams): Promise<ProcessStreamChunkResult> {
  const messages = (chunk as any).messages || []
  
  // Stream thinking/processing indicator and step progression
  if (chunk && typeof chunk === 'object' && 'messages' in chunk) {
    const newMessageCount = messages.length - allMessages.length
    
    // Only send thinking/progression if we have new messages beyond the input
    if (newMessageCount > 0) {
      send({ type: "thinking", message: `Processing step ${newMessageCount}...` })
      send({ type: "step-progression", step: newMessageCount, totalSteps: newMessageCount + 1 })
    }
  }

  // Only process messages that are NEW (beyond the input messages)
  const newMessages = messages.slice(allMessages.length)
  
  let updatedToolExecution = currentToolExecution

  for (const m of newMessages) {
    const type = m?._getType?.()
    
    if (type === "ai") {
      const messageId = m.id || JSON.stringify(m)
      updatedToolExecution = await processAiMessage(
        m,
        messageId,
        processedAiMessages,
        processedToolCalls,
        updatedToolExecution,
        send
      )
    } else if (type === "tool") {
      processToolMessage(m, updatedToolExecution, send)
      updatedToolExecution = null
    }
  }
  
  return {
    currentToolExecution: updatedToolExecution,
    finalResult: chunk
  }
}

