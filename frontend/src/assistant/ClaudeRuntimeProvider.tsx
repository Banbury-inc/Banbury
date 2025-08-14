import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { ApiService } from "../services/apiService";
import { useEffect } from "react";
import type { FC, PropsWithChildren } from "react";

export const ClaudeRuntimeProvider: FC<PropsWithChildren> = ({ children }) => {
  const adapter = {
    async *run(options: { messages: any[]; abortSignal?: AbortSignal }) {
      // Immediately yield a running status to show typing
      const contentParts: any[] = [];
      yield { content: contentParts, status: { type: "running" } } as any;

      try {

      // Get auth token for file access
      const token = localStorage.getItem('authToken');

      // Ensure attachments are included in the request payload as content parts (only for the latest user message)
      const messagesWithAttachmentParts = Array.isArray(options.messages)
        ? (() => {
            const msgs = options.messages.map((m: any) => ({ ...m }));
            const lastUserIdx = [...msgs]
              .map((m: any, i: number) => ({ role: m?.role, i }))
              .reverse()
              .find((x) => x.role === 'user')?.i;
            if (lastUserIdx === undefined) return msgs;

            let attachments: any[] = [];
            const lastUser = msgs[lastUserIdx];
            if (Array.isArray(lastUser?.attachments) && lastUser.attachments.length > 0) {
              attachments = lastUser.attachments;
            } else {
              try {
                const pending = JSON.parse(localStorage.getItem('pendingAttachments') || '[]');
                if (Array.isArray(pending)) attachments = pending;
              } catch {}
            }

            const parts = attachments
              .map((att: any) => {
                const fileId = att?.fileId ?? att?.id ?? att?.file_id;
                const fileName = att?.fileName ?? att?.name;
                const filePath = att?.filePath ?? att?.path;
                const fileData = att?.fileData;
                const mimeType = att?.mimeType;
                if (!fileId || !fileName || !filePath) return null;
                
                const part: any = { type: 'file-attachment', fileId, fileName, filePath };
                
                // Include pre-downloaded file data if available
                if (fileData && mimeType) {
                  part.fileData = fileData;
                  part.mimeType = mimeType;
                }
                
                return part;
              })
              .filter(Boolean) as any[];

            if (parts.length > 0) {
              const baseContent = Array.isArray(lastUser?.content) ? lastUser.content : [];
              lastUser.content = [...baseContent, ...parts];
            }
            return msgs;
          })()
        : options.messages;

      // Read tool preferences from localStorage (defaults if missing)
      let toolPreferences: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; langgraph_mode: boolean } = {
        web_search: true,
        tiptap_ai: true,
        read_file: true,
        langgraph_mode: true, // Always use LangGraph mode
      };
      try {
        const saved = localStorage.getItem('toolPreferences');
        if (saved) {
          toolPreferences = { ...JSON.parse(saved), langgraph_mode: true }; // Force LangGraph mode
        }
      } catch {}

      // Always use LangGraph endpoint
      const apiEndpoint = '/api/assistant/langgraph-stream';

      // Track that a user sent a message to the AI (fire-and-forget)
      try {
        await ApiService.post('/users/ai_message_sent/', {} as any);
      } catch {
        // ignore tracking errors
      }

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({ messages: messagesWithAttachmentParts, toolPreferences }),
        signal: options.abortSignal,
      });

      // Check if the response is not ok (e.g., 400, 500 errors)
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        
        // Try to parse error details from response
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Use default error message if parsing fails
        }
        
        contentParts.push({ type: "text", text: `❌ Error: ${errorMessage}` });
        yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any;
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        contentParts.push({ type: "text", text: "❌ Error: Unable to read response stream" });
        yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any;
        return;
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          const json = chunk.slice(6).trim();
          if (!json) continue;
          
          try {
            const evt = JSON.parse(json);
            
            // Only yield updates for significant content changes, not status updates
            let shouldYield = false;
            
            if (evt.type === "tool-call-start" && evt.part) {
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
              } as any;
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
              } as any;
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
              } as any;
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
              } as any;
            } else if (evt.type === "tool-result" && evt.part) {
              // Handle tool result - update the corresponding tool call with the result
              const toolCalls = contentParts.filter(p => (p as any).type === "tool-call");
              const matchingToolCall = toolCalls.find(tc => (tc as any).toolCallId === evt.part.toolCallId);
              if (matchingToolCall) {
                (matchingToolCall as any).result = evt.part.result;
                // Mark this tool call as completed for proper message formatting
                (matchingToolCall as any).status = "completed";
              }

              // Dispatch an event for create_file to allow UI to refresh and open the new file
              try {
                if ((evt as any).part?.toolName === 'create_file') {
                  const raw = (evt as any).part?.result;
                  let parsed: any = null;
                  if (typeof raw === 'string') {
                    try { parsed = JSON.parse(raw); } catch {}
                  } else if (raw && typeof raw === 'object') {
                    parsed = raw;
                  }
                  const detail = { result: parsed };
                  window.dispatchEvent(new CustomEvent('assistant-file-created', { detail }));
                }
              } catch {}
              shouldYield = true;
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
              } as any;
            } else if (evt.type === "error") {
              // Display error message in chat
              const errorMessage = evt.error || "An error occurred";
              contentParts.push({ type: "text", text: `❌ Error: ${errorMessage}` });
              yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any;
              return; // Stop processing further events
            } else if (evt.type === "message-end") {
              yield { content: contentParts, status: evt.status } as any;
              return; // Don't process further after message end
            }
            
            // Only yield for significant content changes
            if (shouldYield) {
              yield { content: contentParts, status: { type: "running" } } as any;
            }
          } catch (parseError) {
            // Handle JSON parsing errors
            contentParts.push({ type: "text", text: `❌ Error: Invalid response format received` });
            yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any;
            return;
          }
        }
      }
      } catch (error: any) {
        // Handle any unexpected errors during streaming
        const errorMessage = error?.message || "An unexpected error occurred";
        contentParts.push({ type: "text", text: `❌ Error: ${errorMessage}` });
        yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any;
      }
    },
  } as any;
  const runtime = useLocalRuntime(adapter as any);
  
  // Listen for AI requests from Tiptap and auto-send messages
  useEffect(() => {
    const handleAIRequest = (event: CustomEvent) => {
      const { message } = event.detail;
      
      // Send the message to the runtime
      if (runtime && message) {
        runtime.composer.setValue(message);
        setTimeout(() => {
          runtime.composer.send();
        }, 100);
      }
    };
    
    // Also check for pending requests on mount
    const checkPendingRequest = () => {
      try {
        const pending = localStorage.getItem('pendingAIRequest');
        if (pending) {
          const { message, timestamp } = JSON.parse(pending);
          // Only process if it's recent (within 5 seconds)
          if (Date.now() - timestamp < 5000) {
            if (runtime) {
              runtime.composer.setValue(message);
              setTimeout(() => {
                runtime.composer.send();
              }, 100);
            }
          }
          localStorage.removeItem('pendingAIRequest');
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    };
    
    window.addEventListener('assistant-ai-request', handleAIRequest as EventListener);
    
    // Check for pending requests after a short delay to ensure runtime is ready
    const timeoutId = setTimeout(checkPendingRequest, 500);
    
    return () => {
      window.removeEventListener('assistant-ai-request', handleAIRequest as EventListener);
      clearTimeout(timeoutId);
    };
  }, [runtime]);
  
  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};
