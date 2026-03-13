import type { CodeEditToolResultEnvelope } from "../types/codeEdit"

interface HandleToolResultParams {
  evt: any
  contentParts: any[]
}

export function handleToolResult({ evt, contentParts }: HandleToolResultParams): boolean {
  // Handle tool result - update the corresponding tool call with the result
  const toolCalls = contentParts.filter(p => (p as any).type === "tool-call")
  const matchingToolCall = toolCalls.find(tc => (tc as any).toolCallId === evt.part.toolCallId)
  console.log('matchingToolCall', matchingToolCall);
  if (matchingToolCall) {
    try {
      (matchingToolCall as any).result = evt.part.result;
      // Mark this tool call as completed for proper message formatting
      (matchingToolCall as any).status = "completed";
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
    if (toolName === 'create_file' || toolName === 'create_plan' || toolName === 'download_from_url') {
      const raw = (evt as any).part?.result
      let parsed: any = null
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch {}
      } else if (raw && typeof raw === 'object') {
        parsed = raw
      }
      const detail = { result: parsed }
      window.dispatchEvent(new CustomEvent('assistant-file-created', { detail }))
    } else if (toolName === "code_edit_open_file") {
      const raw = (evt as any).part?.result
      let parsed: CodeEditToolResultEnvelope | null = null
      if (typeof raw === "string") {
        try {
          parsed = JSON.parse(raw) as CodeEditToolResultEnvelope
        } catch {}
      } else if (raw && typeof raw === "object") {
        parsed = raw as CodeEditToolResultEnvelope
      }

      if (parsed?.success && parsed.proposal) {
        window.dispatchEvent(new CustomEvent("assistant-code-edit-proposed", { detail: parsed.proposal }))
        window.dispatchEvent(
          new CustomEvent("code-edit-ai-response", {
            detail: { ...parsed.proposal, preview: false },
          })
        )
      }
    } else if (toolName === 'pptx_create_presentation') {
      // Handle PowerPoint presentation creation - dispatch workspace-reopen-file event
      const raw = (evt as any).part?.result
      let parsed: any = null
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch {}
      } else if (raw && typeof raw === 'object') {
        parsed = raw
      }
      
      // Only dispatch if creation was successful and we have fileId
      if (parsed?.success && parsed?.fileId && parsed?.presentationName) {
        // Ensure the filename has .pptx extension for proper file type detection
        const fileName = parsed.presentationName.endsWith('.pptx') 
          ? parsed.presentationName 
          : `${parsed.presentationName}.pptx`
        
        // Also check fileInfo for the actual uploaded filename
        const actualFileName = parsed.fileInfo?.file_name || fileName
        const filePath = `presentations/${actualFileName}`
        
        // Trigger sidebar refresh first
        window.dispatchEvent(new CustomEvent('file-sidebar-refresh'))
        
        // Open the file directly using workspace-reopen-file with the fileId
        // PowerPointViewer will download from S3 using the file_id, so the file
        // doesn't need to be in the file system list yet
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('workspace-reopen-file', {
            detail: {
              newFile: {
                id: parsed.fileId,
                file_id: parsed.fileId,
                name: actualFileName,
                type: 'file',
                path: filePath
              }
            }
          }))
          
          // Also dispatch pptx-presentation-loaded event for PowerPointViewer
          if (parsed.presentationId) {
            window.dispatchEvent(new CustomEvent('pptx-presentation-loaded', {
              detail: { fileId: parsed.fileId, presentationId: parsed.presentationId }
            }))
          }
        }, 500) // Small delay to allow sidebar refresh
      }
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

