import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { useEffect } from "react";

import { ApiService } from "../services/apiService";

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
      let toolPreferences: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean; browserbase: boolean } = {
        web_search: true,
        tiptap_ai: true,
        read_file: true,
        gmail: true,
        langgraph_mode: true, // Always use LangGraph mode
        browserbase: true, // Enable Browserbase tool by default
      };
      try {
        const saved = localStorage.getItem('toolPreferences');
        if (saved) {
          const parsed = JSON.parse(saved);
          toolPreferences = { 
            ...toolPreferences, 
            ...parsed, 
            langgraph_mode: true,
            browserbase: (parsed && typeof parsed.browserbase === 'boolean') ? parsed.browserbase : true,
          }; // Force LangGraph + ensure browserbase present
        }
      } catch {}

      // Always use LangGraph endpoint
      const apiEndpoint = '/api/assistant/langgraph-stream';

      // Track that a user sent a message to the AI and check rate limits
      try {
        const aiResponse = await ApiService.post('/users/ai_message_sent/', {} as any) as any;
        
        // Check if the user has exceeded the AI message limit
        if (aiResponse?.result === 'exceeded_ai_message_limit') {
          contentParts.push({ 
            type: "text", 
            text: "❌ You have exceeded 100 AI requests this month. Please subscribe to the Pro plan for unlimited requests." 
          });
          yield { content: contentParts, status: { type: "incomplete", reason: "rate_limited" } } as any;
          return;
        }
      } catch (error: any) {
        // Check if it's a rate limit error (429 status)
        if (error?.status === 429 || error?.response?.status === 429) {
          contentParts.push({ 
            type: "text", 
            text: "❌ You have exceeded 100 AI requests this month. Please subscribe to the Pro plan for unlimited requests." 
          });
          yield { content: contentParts, status: { type: "incomplete", reason: "rate_limited" } } as any;
          return;
        }
        // ignore other tracking errors
      }

      // Debug + intent: Check the last user message and optionally trigger Browserbase session
      const lastMessage = messagesWithAttachmentParts[messagesWithAttachmentParts.length - 1];
      let lastTextContent: string = '';
      if (lastMessage && lastMessage.role === 'user') {
        lastTextContent = lastMessage.content?.find((c: any) => c.type === 'text')?.text || '';
      }

      // Check for document context in localStorage
      let documentContext = '';
      try {
        documentContext = localStorage.getItem('pendingDocumentContext') || '';
        console.log('[ClaudeRuntimeProvider] DEBUG - Read pendingDocumentContext:', documentContext.slice(0, 200));
        if (documentContext) {
          localStorage.removeItem('pendingDocumentContext'); // Clean up after reading
          console.log('[ClaudeRuntimeProvider] DEBUG - Cleaned up pendingDocumentContext');
        } else {
          console.log('[ClaudeRuntimeProvider] DEBUG - No pendingDocumentContext found');
        }
      } catch (error) {
        console.error('[ClaudeRuntimeProvider] DEBUG - Error reading pendingDocumentContext:', error);
      }

      // Get current date/time context
      const getCurrentDateTimeContext = () => {
        const now = new Date();
        const dateOptions: Intl.DateTimeFormatOptions = { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        };
        const timeOptions: Intl.DateTimeFormatOptions = { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        };
        
        const currentDate = now.toLocaleDateString('en-US', dateOptions);
        const currentTime = now.toLocaleTimeString('en-US', timeOptions);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const isoString = now.toISOString();
        
        return {
          currentDate,
          currentTime,
          timezone,
          isoString,
          formatted: `${currentDate} at ${currentTime} (${timezone})`
        };
      };

      const dateTimeContext = getCurrentDateTimeContext();

      // Removed client-side browser shim - now handled by AI tools

      const requestBody = { 
        messages: messagesWithAttachmentParts, 
        toolPreferences,
        documentContext: documentContext || undefined,
        dateTimeContext
      };
      console.log('[ClaudeRuntimeProvider] DEBUG - Request body documentContext:', requestBody.documentContext?.slice(0, 200));
      console.log('[ClaudeRuntimeProvider] DEBUG - Full request body:', JSON.stringify(requestBody, null, 2).slice(0, 1000));
      
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify(requestBody),
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
              // Handle tool result - update the corresponding tool call with the result
              const toolCalls = contentParts.filter(p => (p as any).type === "tool-call");
              const matchingToolCall = toolCalls.find(tc => (tc as any).toolCallId === evt.part.toolCallId);
              if (matchingToolCall) {
                (matchingToolCall as any).result = evt.part.result;
                // Mark this tool call as completed for proper message formatting
                (matchingToolCall as any).status = "completed";
              }

              // Dispatch events for tools so the UI can react (e.g., open files or browser sessions)
              try {
                const toolName = (evt as any).part?.toolName;
                if (toolName === 'create_file' || toolName === 'download_from_url') {
                  const raw = (evt as any).part?.result;
                  let parsed: any = null;
                  if (typeof raw === 'string') {
                    try { parsed = JSON.parse(raw); } catch {}
                  } else if (raw && typeof raw === 'object') {
                    parsed = raw;
                  }
                  const detail = { result: parsed };
                  window.dispatchEvent(new CustomEvent('assistant-file-created', { detail }));
                } else if (toolName === 'browser' || toolName === 'browser_create_session' || toolName === 'stagehand_create_session') {
                  const raw = (evt as any).part?.result;
                  let parsed: any = null;
                  if (typeof raw === 'string') {
                    try { parsed = JSON.parse(raw); } catch {}
                  } else if (raw && typeof raw === 'object') {
                    parsed = raw;
                  }
                  const candidate = parsed || (evt as any).result || (evt as any).toolResult || (evt as any).data?.result;
                  if (candidate && candidate.viewerUrl) {
                    const detail = { viewerUrl: candidate.viewerUrl, sessionId: candidate.sessionId, title: candidate.title || 'Browser Session' };
                    window.dispatchEvent(new CustomEvent('assistant-open-browser', { detail }));
                  }
                } else if (toolName === 'stagehand_goto') {
                  // After navigation, embed the actual page URL
                  const raw = (evt as any).part?.result;
                  let parsed: any = null;
                  if (typeof raw === 'string') {
                    try { parsed = JSON.parse(raw); } catch {}
                  } else if (raw && typeof raw === 'object') {
                    parsed = raw;
                  }
                  const url = parsed?.url || (evt as any).result?.url;
                  const title = parsed?.title || (evt as any).result?.title || 'Browser Session';
                  if (url) {
                    const detail = { viewerUrl: url, title };
                    window.dispatchEvent(new CustomEvent('assistant-open-browser', { detail }));
                  }
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
  
  // Allow external components to request loading messages into the runtime
  useEffect(() => {
    const handleLoadConversation = async (event: CustomEvent) => {
      const { messages } = event.detail || {};
      console.log('[ClaudeRuntimeProvider] Received load conversation event:', { 
        hasMessages: Array.isArray(messages), 
        messageCount: Array.isArray(messages) ? messages.length : 0,
        hasRuntime: !!runtime 
      });
      
      if (!Array.isArray(messages) || !runtime) {
        console.warn('[ClaudeRuntimeProvider] Invalid load request:', { 
          hasMessages: Array.isArray(messages), 
          hasRuntime: !!runtime 
        });
        return;
      }
      
      try {
        const rt: any = runtime as any;
        const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
        const count = () => {
          try {
            const s = rt?.getState?.() || {};
            const tb = rt?._threadBinding?.getState?.() || {};
            const a = Array.isArray(rt?.messages) ? rt.messages.length : 0;
            const b = Array.isArray(s?.messages) ? s.messages.length : 0;
            const c = Array.isArray(tb?.messages) ? tb.messages.length : 0;
            const d = Array.isArray(s?.thread?.messages) ? s.thread.messages.length : 0;
            const e = Array.isArray(tb?.thread?.messages) ? tb.thread.messages.length : 0;
            return Math.max(a, b, c, d, e);
          } catch { return 0; }
        };

        console.log('[ClaudeRuntimeProvider] Starting message import, current count:', count());

        // Reset first
        if (rt.reset) {
          rt.reset();
          await pause(100); // Give more time for reset
        }
        
        // Try to force runtime initialization by triggering some operations
        console.log('[ClaudeRuntimeProvider] Attempting to initialize runtime...');
        
        // Try to get the runtime state to see what's available
        try {
          const state = rt.getState?.();
          console.log('[ClaudeRuntimeProvider] Initial runtime state:', state);
        } catch (e) {
          console.log('[ClaudeRuntimeProvider] Could not get initial state:', e);
        }
        
        // Try to trigger runtime initialization by calling some methods
        try {
          if (rt.reset) {
            rt.reset();
            await pause(100);
          }
        } catch (e) {
          console.log('[ClaudeRuntimeProvider] Reset failed:', e);
        }
        
        // Check what methods are available after reset
        console.log('[ClaudeRuntimeProvider] Runtime methods after reset:', {
          hasImport: !!rt.import,
          hasExport: !!rt.export,
          hasReset: !!rt.reset,
          hasAppend: !!rt.append,
          hasThreadBinding: !!rt._threadBinding,
          threadBindingHasImport: !!rt._threadBinding?.import,
          threadBindingHasSetState: !!rt._threadBinding?.setState,
          threadBindingHasGetState: !!rt._threadBinding?.getState,
        });

        // Attempt 1: import with thread wrapper
        if (rt.import) {
          try {
            await rt.import({ thread: { messages } });
            await pause(50);
            const newCount = count();
            console.log('[ClaudeRuntimeProvider] Attempt 1 result:', newCount);
            if (newCount > 0) { 
              console.log('[ClaudeRuntimeProvider] Loaded via import(thread.messages)'); 
              return; 
            }
          } catch (e) {
            console.log('[ClaudeRuntimeProvider] Attempt 1 failed:', e);
          }
        }

        // Attempt 2: simple import
        if (rt.import) {
          try {
            await rt.import({ messages });
            await pause(50);
            const newCount = count();
            console.log('[ClaudeRuntimeProvider] Attempt 2 result:', newCount);
            if (newCount > 0) { 
              console.log('[ClaudeRuntimeProvider] Loaded via import(messages)'); 
              return; 
            }
          } catch (e) {
            console.log('[ClaudeRuntimeProvider] Attempt 2 failed:', e);
          }
        }

        // Attempt 3: threadBinding.import
        if (rt._threadBinding?.import) {
          try {
            await rt._threadBinding.import({ thread: { messages } });
            await pause(50);
            const newCount = count();
            console.log('[ClaudeRuntimeProvider] Attempt 3a result:', newCount);
            if (newCount > 0) { 
              console.log('[ClaudeRuntimeProvider] Loaded via _threadBinding.import(thread.messages)'); 
              return; 
            }
          } catch (e) {
            console.log('[ClaudeRuntimeProvider] Attempt 3a failed:', e);
          }
          try {
            await rt._threadBinding.import({ messages });
            await pause(50);
            const newCount = count();
            console.log('[ClaudeRuntimeProvider] Attempt 3b result:', newCount);
            if (newCount > 0) { 
              console.log('[ClaudeRuntimeProvider] Loaded via _threadBinding.import'); 
              return; 
            }
          } catch (e) {
            console.log('[ClaudeRuntimeProvider] Attempt 3b failed:', e);
          }
        }

        // Attempt 4: export snapshot → replace → import
        if (rt.export && rt.import) {
          try {
            const snapshot = await rt.export();
            if (snapshot?.thread?.messages) snapshot.thread.messages = messages;
            else if (snapshot?.thread) snapshot.thread = { ...snapshot.thread, messages };
            else snapshot.messages = messages;
            await rt.import(snapshot);
            await pause(50);
            const newCount = count();
            console.log('[ClaudeRuntimeProvider] Attempt 4 result:', newCount);
            if (newCount > 0) { 
              console.log('[ClaudeRuntimeProvider] Loaded via snapshot import'); 
              return; 
            }
          } catch (e) {
            console.log('[ClaudeRuntimeProvider] Attempt 4 failed:', e);
          }
        }

        // Attempt 5: setState
        if (rt._threadBinding?.setState) {
          try {
            const prev = rt._threadBinding.getState?.() || {};
            const thread = { ...(prev.thread || {}), messages };
            rt._threadBinding.setState({ ...prev, thread, messages });
            await pause(50);
            const newCount = count();
            console.log('[ClaudeRuntimeProvider] Attempt 5 result:', newCount);
            if (newCount > 0) { 
              console.log('[ClaudeRuntimeProvider] Loaded via _threadBinding.setState(thread.messages)'); 
              return; 
            }
          } catch (e) {
            console.log('[ClaudeRuntimeProvider] Attempt 5 failed:', e);
          }
        }

        // Attempt 6: append each
        if (rt.append) {
          try {
            const prev = rt._threadBinding?.getState?.() || {};
            rt._threadBinding?.setState?.({ ...prev, isDisabled: true, isLoading: false });
            for (const m of messages) {
              try { await rt.append(m); } catch {}
            }
            const prev2 = rt._threadBinding?.getState?.() || {};
            rt._threadBinding?.setState?.({ ...prev2, isDisabled: false, isLoading: false });
            await pause(50);
            const newCount = count();
            console.log('[ClaudeRuntimeProvider] Attempt 6 result:', newCount);
            if (newCount > 0) { 
              console.log('[ClaudeRuntimeProvider] Loaded via append(each)'); 
              return; 
            }
          } catch (e) {
            console.log('[ClaudeRuntimeProvider] Attempt 6 failed:', e);
          }
        }

        console.error('[ClaudeRuntimeProvider] Failed to apply messages to runtime after all attempts');
      } catch (e) {
        console.error('[ClaudeRuntimeProvider] Error in handleLoadConversation:', e);
      }
    };

    // Disable the ClaudeRuntimeProvider event handler - let thread.tsx handle conversation loading
    // window.addEventListener('assistant-load-conversation', handleLoadConversation as EventListener);
    // return () => window.removeEventListener('assistant-load-conversation', handleLoadConversation as EventListener);
  }, [runtime]);

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
