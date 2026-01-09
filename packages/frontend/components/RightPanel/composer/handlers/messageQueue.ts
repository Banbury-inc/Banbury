import type { QueuedMessage } from '../components/queued-messages-display'

interface MessageQueueActions {
  addToQueue: (text: string) => void
  removeFromQueue: (id: string) => void
  moveToFront: (id: string) => void
  getNextMessage: () => QueuedMessage | null
  popNextMessage: () => QueuedMessage | null
  clearQueue: () => void
  getQueue: () => QueuedMessage[]
}

export function createMessageQueue(
  setQueuedMessages: React.Dispatch<React.SetStateAction<QueuedMessage[]>>
): MessageQueueActions {
  const addToQueue = (text: string) => {
    const newMessage: QueuedMessage = {
      id: `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      timestamp: Date.now()
    }
    setQueuedMessages(prev => [...prev, newMessage])
  }

  const removeFromQueue = (id: string) => {
    setQueuedMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const moveToFront = (id: string) => {
    setQueuedMessages(prev => {
      const index = prev.findIndex(msg => msg.id === id)
      if (index <= 0) return prev
      
      const message = prev[index]
      const newQueue = [...prev]
      newQueue.splice(index, 1)
      newQueue.unshift(message)
      return newQueue
    })
  }

  const getNextMessage = (): QueuedMessage | null => {
    let result: QueuedMessage | null = null
    setQueuedMessages(prev => {
      result = prev.length > 0 ? prev[0] : null
      return prev
    })
    return result
  }

  const popNextMessage = (): QueuedMessage | null => {
    let result: QueuedMessage | null = null
    setQueuedMessages(prev => {
      if (prev.length === 0) return prev
      result = prev[0]
      return prev.slice(1)
    })
    return result
  }

  const clearQueue = () => {
    setQueuedMessages([])
  }

  const getQueue = (): QueuedMessage[] => {
    let result: QueuedMessage[] = []
    setQueuedMessages(prev => {
      result = prev
      return prev
    })
    return result
  }

  return {
    addToQueue,
    removeFromQueue,
    moveToFront,
    getNextMessage,
    popNextMessage,
    clearQueue,
    getQueue
  }
}

/**
 * Check if the assistant is currently running by looking at ThreadPrimitive state
 */
export function checkIsRunning(threadRuntime: any): boolean {
  try {
    // Try multiple ways to check if running
    const isRunning1 = threadRuntime?.isRunning === true
    const isRunning2 = threadRuntime?._threadBinding?.getState?.()?.isRunning === true
    const isRunning3 = threadRuntime?.getState?.()?.isRunning === true
    
    return isRunning1 || isRunning2 || isRunning3
  } catch {
    return false
  }
}

/**
 * Send the next message from the queue
 */
export function sendNextQueuedMessage(
  queuedMessages: QueuedMessage[],
  setQueuedMessages: React.Dispatch<React.SetStateAction<QueuedMessage[]>>,
  handleSendMessage: (text: string) => void
): boolean {
  if (queuedMessages.length === 0) return false
  
  const nextMessage = queuedMessages[0]
  setQueuedMessages(prev => prev.slice(1))
  
  // Send the message
  handleSendMessage(nextMessage.text)
  
  return true
}
