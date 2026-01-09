import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react"
import { useEffect, useCallback, useRef } from "react"
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
  threadId: string // Stable thread identifier for API requests and todo persistence
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
  threadId,
  userInfo,
  selectedFile,
  selectedEmail,
  onEmailSelect,
}) => {
  // Create a dedicated adapter for this tab (same logic as ClaudeRuntimeProvider)
  // Note: adapter is recreated when threadId changes to ensure it's captured in closure
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
          threadId, // Include stable thread ID for todo persistence
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

  // Mutex to prevent overlapping plan task executions
  const planTaskMutexRef = useRef<boolean>(false)
  const cancelledTaskIdRef = useRef<string | null>(null)
  
  // Ref to store the latest executePlanTask function to avoid listener re-registration issues
  const executePlanTaskRef = useRef<((taskId: string, message: string, planContext: any) => Promise<void>) | null>(null)

  // Expose runtime for the active tab to receive assistant-ai-request messages
  // Use event-based approach since runtime.composer is not directly accessible
  const sendMessage = useCallback((message: string) => {
    if (!message) {
      console.warn('[AiConversationTabPane] Cannot send message - no message provided')
      return
    }
    
    // Dispatch the assistant-composer-send event which the Composer component listens for
    window.dispatchEvent(new CustomEvent('assistant-composer-send', {
      detail: { tabId, text: message }
    }))
  }, [tabId])

  // Helper to get messages from runtime using multiple access patterns (runtime internals vary)
  const getRuntimeMessages = useCallback(() => {
    try {
      const messages1 = runtime?.messages || []
      const messages2 = (runtime as any)?._threadBinding?.getState?.()?.messages || []
      const messages3 = (runtime as any)?.getState?.()?.messages || []
      
      // Return the longest array (most up-to-date)
      if (messages1.length >= messages2.length && messages1.length >= messages3.length) return messages1
      if (messages2.length >= messages3.length) return messages2
      return messages3
    } catch {
      return []
    }
  }, [runtime])

  // Execute a plan task by dispatching to the composer (appears as user send)
  const executePlanTask = useCallback(async (taskId: string, message: string, _planContext: any) => {
    // Mutex guard: prevent overlapping plan tasks
    if (planTaskMutexRef.current) {
      console.warn('[AiConversationTabPane] Plan task already in progress, skipping:', taskId)
      window.dispatchEvent(new CustomEvent('assistant-plan-task-complete', {
        detail: { taskId, tabId, success: false, error: "Another task is already in progress" }
      }))
      return
    }
    
    if (!runtime) {
      console.error('[AiConversationTabPane] No runtime available!')
      window.dispatchEvent(new CustomEvent('assistant-plan-task-complete', {
        detail: { taskId, tabId, success: false, error: "No runtime available" }
      }))
      return
    }

    // Note: We use event-based message sending via assistant-composer-send
    // so we don't need to check for runtime.composer directly

    // Acquire mutex
    planTaskMutexRef.current = true

    try {
      // Get the initial message count before sending
      const initialMessageCount = getRuntimeMessages().length

      // Send the message using the sendMessage function (which uses assistant-composer-send event)
      sendMessage(message)
      
      // Wait for the message to be sent and processed
      await new Promise(resolve => setTimeout(resolve, 800))

      // Wait for the assistant to respond and complete
      // Listen for the assistant-stream-done event which is dispatched when the stream completes
      const waitForStreamDone = (): Promise<boolean> => {
        return new Promise((resolve) => {
          let resolved = false
          
          // Listen for stream done event
          const handleStreamDone = (event: CustomEvent) => {
            if (resolved) return
            
            // Check if this task was cancelled
            if (cancelledTaskIdRef.current === taskId) {
              resolved = true
              window.removeEventListener('assistant-stream-done', handleStreamDone as EventListener)
              clearTimeout(timeoutId)
              cancelledTaskIdRef.current = null
              resolve(false)
              return
            }
            
            const { success, status } = event.detail || {}
            
            resolved = true
            window.removeEventListener('assistant-stream-done', handleStreamDone as EventListener)
            clearTimeout(timeoutId)
            
            // Determine success based on status
            const isSuccess = success && status?.type === 'complete'
            resolve(isSuccess)
          }
          
          window.addEventListener('assistant-stream-done', handleStreamDone as EventListener)
          
          // Timeout after 10 minutes
          const timeoutId = setTimeout(() => {
            if (resolved) return
            resolved = true
            window.removeEventListener('assistant-stream-done', handleStreamDone as EventListener)
            console.warn('[AiConversationTabPane] Task timed out waiting for stream-done:', taskId)
            resolve(false)
          }, 10 * 60 * 1000) // 10 minutes
        })
      }

      const success = await waitForStreamDone()

      // Dispatch completion event with tabId for multi-agent coordination
      window.dispatchEvent(new CustomEvent('assistant-plan-task-complete', {
        detail: { taskId, tabId, success }
      }))
    } catch (error: any) {
      console.error('[AiConversationTabPane] Plan task execution failed:', error)
      window.dispatchEvent(new CustomEvent('assistant-plan-task-complete', {
        detail: { taskId, tabId, success: false, error: error.message }
      }))
    } finally {
      // Release mutex
      planTaskMutexRef.current = false
    }
  }, [runtime, tabId, getRuntimeMessages, sendMessage])

  // Keep the ref updated with the latest executePlanTask function
  useEffect(() => {
    executePlanTaskRef.current = executePlanTask
  }, [executePlanTask])

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

    // Handle plan task execution requests
    // Supports tab-targeted execution via targetTabId, with backward compatibility for active-tab execution
    const handlePlanTaskExecute = (event: CustomEvent) => {
      const { taskId, message, planContext, targetTabId } = event.detail
      
      // Determine if this tab should handle the request:
      // 1. If targetTabId is specified, only handle if it matches this tab's id
      // 2. If targetTabId is not specified (backward compatibility), only handle if this is the active tab
      const activeTabId = (window as any).__banburyActiveAiTabId
      const shouldHandle = targetTabId 
        ? targetTabId === tabId 
        : activeTabId === tabId
      
      if (!shouldHandle) {
        return
      }

      if (taskId && message && executePlanTaskRef.current) {
        executePlanTaskRef.current(taskId, message, planContext)
      } else {
        console.error('[AiConversationTabPane] Cannot execute plan task - executePlanTaskRef is null')
      }
    }

    // Handle plan task cancellation requests
    // Supports tab-targeted cancellation via targetTabId, with backward compatibility for active-tab cancellation
    const handlePlanTaskCancel = (event: CustomEvent) => {
      const { taskId, targetTabId } = event.detail
      
      // Determine if this tab should handle the request:
      // 1. If targetTabId is specified, only handle if it matches this tab's id
      // 2. If targetTabId is not specified (backward compatibility), only handle if this is the active tab
      const activeTabId = (window as any).__banburyActiveAiTabId
      const shouldHandle = targetTabId 
        ? targetTabId === tabId 
        : activeTabId === tabId
      
      if (!shouldHandle) return

      if (taskId) {
        cancelledTaskIdRef.current = taskId
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
    window.addEventListener('assistant-plan-task-execute', handlePlanTaskExecute as EventListener)
    window.addEventListener('assistant-plan-task-cancel', handlePlanTaskCancel as EventListener)
    const timeoutId = setTimeout(checkPendingRequest, 500)

    return () => {
      window.removeEventListener('assistant-ai-request', handleAIRequest as EventListener)
      window.removeEventListener('assistant-plan-task-execute', handlePlanTaskExecute as EventListener)
      window.removeEventListener('assistant-plan-task-cancel', handlePlanTaskCancel as EventListener)
      clearTimeout(timeoutId)
    }
  }, [tabId, sendMessage]) // Note: executePlanTask is accessed via ref to avoid listener re-registration issues

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

