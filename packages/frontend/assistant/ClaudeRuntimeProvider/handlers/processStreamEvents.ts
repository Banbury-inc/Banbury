import { handleToolResult } from "./handleToolResult";

interface ProcessStreamEventsParams {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  contentParts: any[];
}

export async function* processStreamEvents({
  reader,
  contentParts,
}: ProcessStreamEventsParams): AsyncGenerator<{ content: any[]; status: any }> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const decoded = decoder.decode(value, { stream: true });
    buffer += decoded;
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";
    
    for (const chunk of chunks) {
      if (!chunk.startsWith("data: ")) {
        continue;
      }
      const json = chunk.slice(6).trim();
      if (!json) continue;
      
      try {
        const evt = JSON.parse(json);
        
        // Only yield updates for significant content changes, not status updates
        let shouldYield = false;
        
        if (evt.type === "message-start") {
          // Handle message start - no action needed, just acknowledge
        } else if (evt.type === "tool-call-start" && evt.part) {
          // Handle tool-call-start event
          contentParts.push(evt.part);
          shouldYield = true;
        } else if (evt.type === "text-delta" && evt.text) {
          // Don't accumulate - the backend is already sending true deltas
          // Just append the new text to the existing text content
          const last = contentParts[contentParts.length - 1];
          if (last && (last as any).type === "text") {
            (last as any).text += evt.text;
          } else {
            contentParts.push({ type: "text", text: evt.text });
          }
          shouldYield = true;
        } else if (evt.type === "thinking") {
          // Handle thinking messages - could be displayed as temporary status
          yield { 
            content: contentParts, 
            status: { 
              type: "running",
              details: { thinking: evt.message }
            } 
          };
        } else if (evt.type === "step-progression") {
          // Handle step progression - show progress
          yield { 
            content: contentParts, 
            status: { 
              type: "running",
              details: { 
                step: evt.step, 
                totalSteps: evt.totalSteps,
                progress: evt.step && evt.totalSteps ? (evt.step / evt.totalSteps) * 100 : undefined
              }
            } 
          };
        } else if (evt.type === "tool-status") {
          // Handle tool status messages
          yield { 
            content: contentParts, 
            status: { 
              type: "running",
              details: { 
                toolStatus: { 
                  tool: evt.tool, 
                  message: evt.message 
                }
              }
            } 
          };
        } else if (evt.type === "tool-completion") {
          // Handle tool completion
          yield { 
            content: contentParts, 
            status: { 
              type: "running",
              details: { 
                toolCompleted: { 
                  tool: evt.tool, 
                  message: evt.message 
                }
              }
            } 
          };

          // Fallback: if the provider sends viewerUrl only in the completion message
          try {
            if (typeof evt.message === 'string') {
              let parsed: any = null;
              try { parsed = JSON.parse(evt.message); } catch {}
              if (parsed && parsed.viewerUrl) {
                const detail = { viewerUrl: parsed.viewerUrl, sessionId: parsed.sessionId, title: parsed.title || 'Browser Session' };
                window.dispatchEvent(new CustomEvent('assistant-open-browser', { detail }));
              }
            } else if (evt.message && typeof evt.message === 'object' && (evt.message as any).viewerUrl) {
              const p: any = evt.message as any;
              const detail = { viewerUrl: p.viewerUrl, sessionId: p.sessionId, title: p.title || 'Browser Session' };
              window.dispatchEvent(new CustomEvent('assistant-open-browser', { detail }));
            }
          } catch {}
          shouldYield = true;
        } else if (evt.type === "tool-result" && evt.part) {
          try {
            shouldYield = handleToolResult({ evt, contentParts });
          } catch (toolError) {
            // Continue processing even if tool result handling fails
            shouldYield = true;
          }
        } else if (evt.type === "completion-summary") {
          // Handle completion summary
          yield { 
            content: contentParts, 
            status: { 
              type: "running",
              details: { 
                summary: {
                  totalSteps: evt.totalSteps,
                  toolExecutions: evt.toolExecutions,
                  toolsUsed: evt.toolsUsed
                }
              }
            } 
          };
        } else if (evt.type === "error") {
          // Display error message in chat
          const errorMessage = evt.error || "An error occurred";
          contentParts.push({ type: "text", text: `❌ Error: ${errorMessage}` });
          yield { content: contentParts, status: { type: "incomplete", reason: "error" } };
          return; // Stop processing further events
        } else if (evt.type === "error-details") {
          // Handle error details (stack traces, etc.)
          console.error('[processStreamEvents] Error details:', evt.stack);
          // Don't yield here, just log the details
        } else if (evt.type === "message-end" || evt.type === "done") {
          yield { content: contentParts, status: evt.status || { type: "complete" } };
          return; // Don't process further after message end
        }
        
        // Only yield for significant content changes
        if (shouldYield) {
          yield { content: contentParts, status: { type: "running" } };
        }
      } catch (parseError) {
        // Handle JSON parsing errors
        contentParts.push({ type: "text", text: `❌ Error: Invalid response format received` });
        yield { content: contentParts, status: { type: "incomplete", reason: "error" } };
        return;
      }
    }
  }
}

