import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react"
import { useEffect, useCallback } from "react"
import { getLangGraphConfig } from "../../assistant/ClaudeRuntimeProvider/handlers/config"
import { getCurrentDateTimeContext } from "../../assistant/ClaudeRuntimeProvider/handlers/getCurrentDateTimeContext"
import { prepareMessagesWithAttachments } from "../../assistant/ClaudeRuntimeProvider/handlers/prepareMessagesWithAttachments"
import { getToolPreferences } from "../../assistant/ClaudeRuntimeProvider/handlers/getToolPreferences"
import { checkRateLimit } from "../../assistant/ClaudeRuntimeProvider/handlers/checkRateLimit"
import { getDocumentContext } from "../../assistant/ClaudeRuntimeProvider/handlers/getDocumentContext"
import { handleFetchError } from "../../assistant/ClaudeRuntimeProvider/handlers/handleFetchError"
import { processStreamEvents } from "../../assistant/ClaudeRuntimeProvider/handlers/processStreamEvents"
import { Thread } from "./composer/thread/thread"
import { FileSystemItem } from "../../utils/fileTreeUtils"

import type { FC } from "react"

interface AiConversationTabPaneProps {
  tabId: string
  userInfo: {
    username: string
    email?: string
  } | null
  selectedFile?: FileSystemItem | null
  selectedEmail?: any | null
  onEmailSelect?: (email: any) => void
  onClearConversation?: () => void
}

export const AiConversationTabPane: FC<AiConversationTabPaneProps> = ({
  tabId,
  userInfo,
  selectedFile,
  selectedEmail,
  onEmailSelect,
}) => {
  // Create a dedicated adapter for this tab (same logic as ClaudeRuntimeProvider)
  const adapter = {
    async *run(options: { messages: any[]; abortSignal?: AbortSignal }) {
      const contentParts: any[] = []
      yield { content: contentParts, status: { type: "running" } } as any

      try {
        const token = localStorage.getItem('authToken')
        const langGraphConfig = getLangGraphConfig()
        const messagesWithAttachmentParts = prepareMessagesWithAttachments({ messages: options.messages })
        const toolPreferences = getToolPreferences()
        const apiEndpoint = '/api/assistant/langgraph-stream'

        const rateLimitResult = await checkRateLimit()
        if (rateLimitResult.exceeded) {
          contentParts.push({ 
            type: "text", 
            text: rateLimitResult.errorMessage || "Rate limit exceeded" 
          })
          yield { content: contentParts, status: { type: "incomplete", reason: "rate_limited" } } as any
          return
        }

        const documentContext = getDocumentContext()
        const dateTimeContext = getCurrentDateTimeContext()

        const requestBody = { 
          messages: messagesWithAttachmentParts, 
          toolPreferences,
          documentContext: documentContext || undefined,
          dateTimeContext,
          recursionLimit: langGraphConfig.recursionLimit,
        }
        
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { 
            "content-type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify(requestBody),
          signal: options.abortSignal,
        })

        if (!res.ok) {
          const errorMessage = await handleFetchError({ response: res })
          contentParts.push({ type: "text", text: `❌ Error: ${errorMessage}` })
          yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          contentParts.push({ type: "text", text: "❌ Error: Unable to read response stream" })
          yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any
          return
        }

        yield* processStreamEvents({
          reader,
          contentParts,
        })
      } catch (error: any) {
        const errorMessage = error?.message || "An unexpected error occurred"
        contentParts.push({ type: "text", text: `❌ Error: ${errorMessage}` })
        yield { content: contentParts, status: { type: "incomplete", reason: "error" } } as any
      }
    },
  } as any

  const runtime = useLocalRuntime(adapter as any)

  // Expose runtime for the active tab to receive assistant-ai-request messages
  const sendMessage = useCallback((message: string) => {
    if (runtime && message) {
      runtime.composer.setValue(message)
      setTimeout(() => {
        runtime.composer.send()
      }, 100)
    }
  }, [runtime])

  // Register this tab's sendMessage function when it becomes active
  useEffect(() => {
    const handleAIRequest = (event: CustomEvent) => {
      // Only handle if this is the active tab
      const activeTabId = (window as any).__banburyActiveAiTabId
      if (activeTabId !== tabId) return

      const { message } = event.detail
      if (message) {
        sendMessage(message)
      }
    }

    // Also check for pending requests on mount if this is the active tab
    const checkPendingRequest = () => {
      const activeTabId = (window as any).__banburyActiveAiTabId
      if (activeTabId !== tabId) return

      try {
        const pending = localStorage.getItem('pendingAIRequest')
        if (pending) {
          const { message, timestamp } = JSON.parse(pending)
          if (Date.now() - timestamp < 5000) {
            sendMessage(message)
          }
          localStorage.removeItem('pendingAIRequest')
        }
      } catch {
        // Ignore localStorage errors
      }
    }

    window.addEventListener('assistant-ai-request', handleAIRequest as EventListener)
    const timeoutId = setTimeout(checkPendingRequest, 500)

    return () => {
      window.removeEventListener('assistant-ai-request', handleAIRequest as EventListener)
      clearTimeout(timeoutId)
    }
  }, [tabId, sendMessage])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread
        userInfo={userInfo}
        selectedFile={selectedFile}
        selectedEmail={selectedEmail}
        onEmailSelect={onEmailSelect}
        assistantTabId={tabId}
      />
    </AssistantRuntimeProvider>
  )
}

