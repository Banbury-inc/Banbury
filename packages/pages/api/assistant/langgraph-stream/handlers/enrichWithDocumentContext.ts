import type { AssistantUiMessage } from "../types"

interface EnrichWithDocumentContextParams {
  messages: AssistantUiMessage[]
  documentContext?: string
}

export function enrichWithDocumentContext({ 
  messages, 
  documentContext 
}: EnrichWithDocumentContextParams): AssistantUiMessage[] {
  if (!documentContext || messages.length === 0) return messages
  
  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role !== 'user') return messages
  
  // Get the text content from the last user message
  const textContent = lastMessage.content.find((part: any) => part.type === 'text')?.text || ''
  
  // Combine with document context
  const enhancedText = textContent + documentContext
  
  // Update the content with the enhanced text
  const updatedContent = lastMessage.content.map((part: any) => 
    part.type === 'text' ? { ...part, text: enhancedText } : part
  )
  
  // If no text content found, add it
  if (!lastMessage.content.some((part: any) => part.type === 'text')) {
    updatedContent.unshift({ type: 'text', text: enhancedText })
  }
  
  // Update the last message
  const updatedMessages = [...messages]
  updatedMessages[messages.length - 1] = {
    ...lastMessage,
    content: updatedContent
  }
  
  return updatedMessages
}

