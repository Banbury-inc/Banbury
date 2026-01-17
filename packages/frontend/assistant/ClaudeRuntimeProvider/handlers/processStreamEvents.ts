import { handleToolResult } from "./handleToolResult";
import type { TodoEvent } from "../../../types/todo-types";

interface ProcessStreamEventsParams {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  contentParts: any[];
}

// Dispatch todo events to the global event bus for the todo store to handle
function dispatchTodoEvent(event: TodoEvent): void {
  try {
    window.dispatchEvent(new CustomEvent('assistant-todo-event', { detail: event }));
  } catch {
    // Ignore event dispatch errors
  }
}

// Dispatch subagent events to the global event bus for UI visualization
function dispatchSubagentEvent(event: any): void {
  try {
    window.dispatchEvent(new CustomEvent('assistant-subagent-event', { detail: event }));
  } catch {
    // Ignore event dispatch errors
  }
}

export async function* processStreamEvents({
  reader,
  contentParts,
}: ProcessStreamEventsParams): AsyncGenerator<{ content: any[]; status: any }> {
  const decoder = new TextDecoder();
  let buffer = "";
  let streamIsIdle = false; // Track if stream is idle between content

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
        } else if (evt.type === "agent-type") {
          // Handle agent type event - show which agent is running
          yield { 
            content: contentParts, 
            status: { 
              type: "running",
              details: { 
                agentType: evt.agentType,
                agentLabel: evt.agentLabel,
                agentDescription: evt.description
              }
            } 
          };
        } else if (evt.type === "tool-call-start" && evt.part) {
          // Handle tool-call-start event and clear idle state
          streamIsIdle = false;
          contentParts.push(evt.part);
          shouldYield = true;
        } else if (evt.type === "text-delta" && evt.text) {
          // Don't accumulate - the backend is already sending true deltas
          // Just append the new text to the existing text content
          const lastIndex = contentParts.length - 1;
          const last = contentParts[lastIndex];

          // Check if last part is a regular text part (not a subagent part)
          if (last && (last as any).type === "text" && !(last as any).subagentId) {
            // Create new text part object with updated text
            contentParts[lastIndex] = {
              ...last,
              text: (last as any).text + evt.text,
            };
          } else {
            // Create new text part for main agent content
            contentParts.push({ type: "text", text: evt.text });
          }

          // Clear idle state since content is actively streaming
          streamIsIdle = false;
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
          // Handle tool status messages and clear idle state
          streamIsIdle = false;
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
          // Handle tool completion and set idle state
          streamIsIdle = true;
          yield {
            content: contentParts,
            status: {
              type: "running",
              details: {
                toolCompleted: {
                  tool: evt.tool,
                  message: evt.message
                },
                waitingForContent: true
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

          // Set idle state and yield status to show "Processing..." indicator
          streamIsIdle = true;
          yield {
            content: contentParts,
            status: {
              type: "running",
              details: {
                waitingForContent: true
              }
            }
          };
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
        } else if (evt.type === "token-usage") {
          // Handle token usage event - store for context wheel calibration
          const tokenUsage = {
            inputTokens: evt.inputTokens || 0,
            outputTokens: evt.outputTokens || 0,
            totalTokens: evt.totalTokens || 0,
            model: evt.model || "",
            timestamp: Date.now(),
          };
          
          // Store in localStorage for the composer to use
          try {
            localStorage.setItem("lastTokenUsage", JSON.stringify(tokenUsage));
          } catch {
            // Ignore localStorage errors
          }
          
          // Dispatch event for any listeners (e.g., context wheel)
          try {
            window.dispatchEvent(new CustomEvent("assistant-token-usage", { detail: tokenUsage }));
          } catch {
            // Ignore event dispatch errors
          }
          
          // Don't yield - this is metadata, not content
        } else if (evt.type === "error") {
          // Display error message in chat
          const errorMessage = evt.error || "An error occurred";
          contentParts.push({ type: "text", text: `❌ Error: ${errorMessage}` });
          yield { content: contentParts, status: { type: "incomplete", reason: "error" } };
          return; // Stop processing further events
        } else if (evt.type === "pptx-live-update") {
          // Handle PowerPoint live update events from backend tools
          console.log('[processStreamEvents] Dispatching pptx-live-update event:', evt);
          window.dispatchEvent(new CustomEvent('pptx-live-update', { 
            detail: evt 
          }));
          // Don't yield - this is a UI update event, not content
        } else if (evt.type === "file-generated") {
          // Handle Skills-generated files (PowerPoint, Word, Excel, PDF)
          const { fileType, fileId, fileName, downloadUrl } = evt;

          // Dispatch event based on file type (for viewers already open)
          if (fileType === 'pptx') {
            window.dispatchEvent(new CustomEvent('powerpoint-file-generated', {
              detail: { fileType, fileId, fileName, downloadUrl }
            }));
          } else if (fileType === 'docx') {
            window.dispatchEvent(new CustomEvent('word-file-generated', {
              detail: { fileType, fileId, fileName, downloadUrl }
            }));
          } else if (fileType === 'xlsx') {
            window.dispatchEvent(new CustomEvent('excel-file-generated', {
              detail: { fileType, fileId, fileName, downloadUrl }
            }));
          } else if (fileType === 'pdf') {
            window.dispatchEvent(new CustomEvent('pdf-file-generated', {
              detail: { fileType, fileId, fileName, downloadUrl }
            }));
          }

          // Also dispatch assistant-file-created to trigger auto-open
          window.dispatchEvent(new CustomEvent('assistant-file-created', {
            detail: {
              result: {
                file_info: {
                  file_id: fileId,
                  file_name: fileName,
                  file_path: downloadUrl
                }
              }
            }
          }));

          // Add a text message to indicate file was generated
          contentParts.push({
            type: "text",
            text: `✅ Generated ${fileType.toUpperCase()} file: ${fileName}`
          });
          shouldYield = true;
        } else if (evt.type === "error-details") {
          // Handle error details (stack traces, etc.)
          console.error('[processStreamEvents] Error details:', evt.stack);
          // Don't yield here, just log the details
        } else if (
          evt.type === "todo-list-init" ||
          evt.type === "todo-item-add" ||
          evt.type === "todo-item-update" ||
          evt.type === "todo-item-remove" ||
          evt.type === "todo-active-change"
        ) {
          // Handle todo events - dispatch to the todo store via custom event
          dispatchTodoEvent(evt as TodoEvent);
          // Don't yield - these are metadata events, not content
        } else if (evt.type === "subagent-spawn-start") {
          // Multi-agent spawn started - dispatch event and yield status
          dispatchSubagentEvent(evt);
          streamIsIdle = false;
          yield {
            content: contentParts,
            status: {
              type: "running",
              details: {
                subagentSpawn: {
                  status: "starting",
                  count: evt.subagentCount,
                  roles: evt.roles
                }
              }
            }
          };
        } else if (evt.type === "subagent-start") {
          // Individual subagent started - dispatch event only
          dispatchSubagentEvent(evt);
        } else if (evt.type === "subagent-content") {
          // Subagent streaming content - dispatch event only
          dispatchSubagentEvent(evt);
        } else if (evt.type === "subagent-tool-call-start") {
          // Subagent tool call - dispatch event only
          dispatchSubagentEvent(evt);
        } else if (evt.type === "subagent-tool-result") {
          // Subagent tool result - dispatch event only
          dispatchSubagentEvent(evt);
        } else if (evt.type === "subagent-end") {
          // Individual subagent completed - dispatch event only
          dispatchSubagentEvent(evt);
        } else if (evt.type === "subagent-spawn-complete") {
          // All subagents completed
          dispatchSubagentEvent(evt);
          streamIsIdle = true;
          yield {
            content: contentParts,
            status: {
              type: "running",
              details: {
                subagentSpawn: {
                  status: "complete",
                  completedCount: evt.completedCount,
                  failedCount: evt.failedCount,
                  totalDurationMs: evt.totalDurationMs
                },
                waitingForContent: true
              }
            }
          };
        } else if (evt.type === "subagent-spawn-error") {
          // Subagent spawn validation/error
          dispatchSubagentEvent(evt);
          yield {
            content: contentParts,
            status: {
              type: "running",
              details: {
                subagentSpawn: {
                  status: "error",
                  errors: evt.errors
                }
              }
            }
          };
        } else if (evt.type === "message-end" || evt.type === "done") {
          // Dispatch event to notify that the assistant has finished responding
          try {
            window.dispatchEvent(new CustomEvent('assistant-stream-done', { 
              detail: { 
                success: true,
                status: evt.status || { type: "complete" }
              } 
            }));
          } catch {
            // Ignore event dispatch errors
          }
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

