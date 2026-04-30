const TOOL_COMPLETION_MESSAGES: Record<string, string> = {
  web_search: "Web search completed",
  web_extract: "Content extraction completed",
  web_crawl: "Website crawl completed",
  web_map: "Site map generated",
  web_research: "Research task initiated",
  web_get_research: "Research results retrieved",
  web_usage: "Usage statistics retrieved",
  tiptap_ai: "Document processing completed",
  sheet_ai: "Spreadsheet edits ready",
  store_memory: "Memory stored successfully",
  search_memory: "Memory search completed",
  create_file: "File created successfully",
  code_edit_open_file: "Code edit proposal ready",
  spawn_subagents: "Subagents completed",
  write_todos: "Task list updated"
}

function getToolCompletionMessage(toolName: string): string {
  if (TOOL_COMPLETION_MESSAGES[toolName]) return TOOL_COMPLETION_MESSAGES[toolName]
  if (toolName.startsWith('gmail_')) return 'Gmail operation completed'
  return `${toolName} completed`
}

export function processToolMessage(
  message: any,
  currentToolExecution: any,
  toolExecutionMap: Map<string, any>,
  send: (event: any) => void
): void {
  // Look up the tool execution by tool_call_id
  const toolCallId = message.tool_call_id || ""
  const toolExecution = toolExecutionMap.get(toolCallId) || currentToolExecution
  const toolName = toolExecution?.name || "unknown"
  
  // Send tool execution completion event
  send({
    type: "tool-result",
    part: {
      type: "tool-result",
      toolCallId: toolCallId,
      toolName: toolName,
      result: message.content,
    },
  })
  
  // Stream tool completion status
  if (toolName && toolName !== "unknown") {
    const completionMessage = getToolCompletionMessage(toolName)
    send({ type: "tool-completion", tool: toolName, message: completionMessage })
  }
  
  // Clean up from map after processing
  if (toolCallId) {
    toolExecutionMap.delete(toolCallId)
  }
}
