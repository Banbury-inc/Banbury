interface HandleToolResultParams {
  evt: any
  contentParts: any[]
}

export function handleToolResult({ evt, contentParts }: HandleToolResultParams): boolean {
  // Handle tool result - update the corresponding tool call with the result
  const toolCalls = contentParts.filter(p => (p as any).type === "tool-call")
  const matchingToolCall = toolCalls.find(tc => (tc as any).toolCallId === evt.part.toolCallId)
  if (matchingToolCall) {
    try {
      console.log('[handleToolResult] Setting result for tool call:', evt.part.toolCallId);
      console.log('[handleToolResult] Result type:', typeof evt.part.result);
      console.log('[handleToolResult] Result value:', evt.part.result?.substring ? evt.part.result.substring(0, 100) : evt.part.result);
      (matchingToolCall as any).result = evt.part.result;
      // Mark this tool call as completed for proper message formatting
      (matchingToolCall as any).status = "completed";
      console.log('[handleToolResult] Successfully set result');
    } catch (error) {
      console.error('[handleToolResult] Error setting result:', error);
      // Try alternative approach - just add the result as a new property
      try {
        matchingToolCall['toolResult'] = evt.part.result;
        matchingToolCall['status'] = "completed";
      } catch (altError) {
        console.error('[handleToolResult] Alternative approach also failed:', altError);
      }
    }
  }

  // Dispatch events for tools so the UI can react (e.g., open files or browser sessions)
  try {
    const toolName = (evt as any).part?.toolName
    if (toolName === 'create_file' || toolName === 'download_from_url') {
      const raw = (evt as any).part?.result
      let parsed: any = null
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch {}
      } else if (raw && typeof raw === 'object') {
        parsed = raw
      }
      const detail = { result: parsed }
      window.dispatchEvent(new CustomEvent('assistant-file-created', { detail }))
    } else if (toolName === 'browser' || toolName === 'browser_create_session' || toolName === 'stagehand_create_session') {
      const raw = (evt as any).part?.result
      let parsed: any = null
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch {}
      } else if (raw && typeof raw === 'object') {
        parsed = raw
      }
      const candidate = parsed || (evt as any).result || (evt as any).toolResult || (evt as any).data?.result
      if (candidate && candidate.viewerUrl) {
        const detail = { viewerUrl: candidate.viewerUrl, sessionId: candidate.sessionId, title: candidate.title || 'Browser Session' }
        window.dispatchEvent(new CustomEvent('assistant-open-browser', { detail }))
      }
    } else if (toolName === 'stagehand_goto') {
      // After navigation, embed the actual page URL
      const raw = (evt as any).part?.result
      let parsed: any = null
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch {}
      } else if (raw && typeof raw === 'object') {
        parsed = raw
      }
      const url = parsed?.url || (evt as any).result?.url
      const title = parsed?.title || (evt as any).result?.title || 'Browser Session'
      if (url) {
        const detail = { viewerUrl: url, title }
        window.dispatchEvent(new CustomEvent('assistant-open-browser', { detail }))
      }
    }
  } catch {}
  
  return true // shouldYield
}

