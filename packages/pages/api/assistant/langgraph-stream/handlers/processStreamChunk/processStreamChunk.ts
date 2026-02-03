import { processAiMessage } from './processAiMessage'
import { processToolMessage } from './processToolMessage'

interface ProcessStreamChunkParams {
  chunk: any
  allMessages: any[]
  processedAiMessages: Set<string>
  processedToolCalls: Set<string>
  currentToolExecution: any
  toolExecutionMap: Map<string, any>
  send: (event: any) => void
  threadId?: string
}

interface ProcessStreamChunkResult {
  currentToolExecution: any
  toolExecutionMap: Map<string, any>
  finalResult: any
}

export async function processStreamChunk({
  chunk,
  allMessages,
  processedAiMessages,
  processedToolCalls,
  currentToolExecution,
  toolExecutionMap,
  send,
  threadId
}: ProcessStreamChunkParams): Promise<ProcessStreamChunkResult> {
  const messages = (chunk as any).messages || []
  
  // Stream thinking/processing indicator and step progression
  if (chunk && typeof chunk === 'object' && 'messages' in chunk) {
    const newMessageCount = messages.length - allMessages.length
    
    // Only send thinking/progression if we have new messages beyond the input
    if (newMessageCount > 0) {
      send({ type: "thinking", message: `Processing step ${newMessageCount}...` })
      send({ type: "step-progression", step: newMessageCount, totalSteps: newMessageCount + 1 })
    }
  }

  // Only process messages that are NEW (beyond the input messages)
  const newMessages = messages.slice(allMessages.length)
  
  let updatedToolExecution = currentToolExecution

  for (const m of newMessages) {
    const type = m?._getType?.()
    if (type === "ai") {
      const messageId = m.id || JSON.stringify(m)
      updatedToolExecution = await processAiMessage(
        m,
        messageId,
        processedAiMessages,
        processedToolCalls,
        updatedToolExecution,
        toolExecutionMap,
        send,
        threadId
      )
    } else if (type === "tool") {
      processToolMessage(m, updatedToolExecution, toolExecutionMap, send)
      updatedToolExecution = null
    }
  }
  
  return {
    currentToolExecution: updatedToolExecution,
    toolExecutionMap,
    finalResult: chunk
  }
}

