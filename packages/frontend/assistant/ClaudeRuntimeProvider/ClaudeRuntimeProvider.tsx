import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { useEffect } from "react";
import { getLangGraphConfig } from "./handlers/config";
import { getCurrentDateTimeContext } from "./handlers/getCurrentDateTimeContext";
import { prepareMessagesWithAttachments } from "./handlers/prepareMessagesWithAttachments";
import { getToolPreferences } from "./handlers/getToolPreferences";
import { checkRateLimit } from "./handlers/checkRateLimit";
import { getDocumentContext } from "./handlers/getDocumentContext";
import { handleFetchError } from "./handlers/handleFetchError";
import { processStreamEvents } from "./handlers/processStreamEvents";
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

      // Get LangGraph configuration for recursion limits
      const langGraphConfig = getLangGraphConfig();

      // Ensure attachments are included in the request payload as content parts (only for the latest user message)
      const messagesWithAttachmentParts = prepareMessagesWithAttachments({ messages: options.messages });

      // Read tool preferences from localStorage (defaults if missing)
      const toolPreferences = getToolPreferences();

      // Always use LangGraph endpoint
      const apiEndpoint = '/api/assistant/langgraph-stream';

      // Track that a user sent a message to the AI and check rate limits
      const rateLimitResult = await checkRateLimit();
      if (rateLimitResult.exceeded) {
        contentParts.push({ 
          type: "text", 
          text: rateLimitResult.errorMessage || "Rate limit exceeded" 
        });
        yield { content: contentParts, status: { type: "incomplete", reason: "rate_limited" } } as any;
        return;
      }

      // Debug + intent: Check the last user message and optionally trigger Browserbase session
      const lastMessage = messagesWithAttachmentParts[messagesWithAttachmentParts.length - 1];
      let lastTextContent: string = '';
      if (lastMessage && lastMessage.role === 'user') {
        lastTextContent = lastMessage.content?.find((c: any) => c.type === 'text')?.text || '';
      }

      // Check for document context in localStorage
      const documentContext = getDocumentContext();

      // Get current date/time context
      const dateTimeContext = getCurrentDateTimeContext();

      // Removed client-side browser shim - now handled by AI tools

      const requestBody = { 
        messages: messagesWithAttachmentParts, 
        toolPreferences,
        documentContext: documentContext || undefined,
        dateTimeContext,
        recursionLimit: langGraphConfig.recursionLimit, // Add recursion limit
      };
      
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
        const errorMessage = await handleFetchError({ response: res });
        contentParts.push({ type: "text", text: `❌ Error: ${errorMessage}` });
        yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any;
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        contentParts.push({ type: "text", text: "❌ Error: Unable to read response stream" });
        yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any;
        return;
      }

      yield* processStreamEvents({
        reader,
        contentParts,
      });
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
