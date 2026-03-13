const TOOL_STATUS_MESSAGES: Record<string, string> = {
  web_search: "Searching the web...",
  web_extract: "Extracting content from URLs...",
  web_crawl: "Crawling website...",
  web_map: "Mapping website structure...",
  web_research: "Starting comprehensive research...",
  web_get_research: "Retrieving research results...",
  web_usage: "Fetching API usage statistics...",
  tiptap_ai: "Processing document content...",
  sheet_ai: "Processing spreadsheet edits...",
  store_memory: "Storing information in memory...",
  search_memory: "Searching memory...",
  create_file: "Creating file...",
  spawn_subagents: "Spawning subagents...",
  write_todos: "Updating task list..."
}

function getToolStatusMessage(toolName: string): string {
  if (TOOL_STATUS_MESSAGES[toolName]) return TOOL_STATUS_MESSAGES[toolName]
  if (toolName.startsWith('gmail_')) return 'Accessing Gmail…'
  return `Executing...`
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

export async function processAiMessage(
  message: any,
  messageId: string,
  processedAiMessages: Set<string>,
  processedToolCalls: Set<string>,
  currentToolExecution: any,
  toolExecutionMap: Map<string, any>,
  send: (event: any) => void,
  threadId?: string
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
    
    // Store tool execution in map by tool_call_id for later retrieval
    toolExecutionMap.set(toolCall.id, toolCall)
    
    // Handle write_todos tool call - emit todo SSE events for frontend
    if (toolCall.name === "write_todos" && toolCall.args?.todos && threadId) {
      const todos = toolCall.args.todos
      // Convert middleware todo format to frontend TodoItem format
      const todoItems = todos.map((t: { content: string; status: string }, index: number) => ({
        id: `agent-todo-${Date.now()}-${index}`,
        description: t.content,
        status: t.status === "completed" ? "completed" : t.status === "in_progress" ? "in_progress" : "pending",
        source: "agent" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      
      // Find the active todo (first in_progress one)
      const activeTodo = todoItems.find((t: { status: string }) => t.status === "in_progress")
      
      // Send todo-list-init event to initialize/replace the todo list
      send({
        type: "todo-list-init",
        threadId,
        todos: todoItems,
        activeTodoId: activeTodo?.id || null,
      })
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
