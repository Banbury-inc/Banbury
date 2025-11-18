import { HumanMessage, SystemMessage, AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages"
import type { AssistantUiMessage } from "../types"
import { extractTextFromDocx } from "./handleExtractTextFromDocx"
import { extractTextFromXlsx } from "./handleExtractTextFromXLSX"

const MIME_TYPE_MAP: Record<string, string> = {
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc': 'application/msword',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'html': 'text/html',
  'md': 'text/markdown',
  'json': 'application/json',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel'
}

const OFFICE_DOCUMENT_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

function normalizeMimeType(mimeType: string, fileName: string): string {
  if (mimeType !== 'application/octet-stream') return mimeType
  
  const ext = fileName.split('.').pop()?.toLowerCase()
  return MIME_TYPE_MAP[ext || ''] || mimeType
}

function processOfficeDocument(fileData: string, mimeType: string, fileName: string): string {
  try {
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const binaryData = Buffer.from(fileData, 'base64')
      const extractedText = extractTextFromDocx(binaryData, fileName)
      return Buffer.from(extractedText, 'utf8').toString('base64')
    }
    
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      const binaryData = Buffer.from(fileData, 'base64')
      const extractedText = extractTextFromXlsx(binaryData, fileName)
      return Buffer.from(extractedText, 'utf8').toString('base64')
    }
    
    const fileInfo = `This is a ${fileName} file (${mimeType}). Please ask the user to provide key information from this document.`
    return Buffer.from(fileInfo, 'utf8').toString('base64')
  } catch (error) {
    const fallbackInfo = `This is a ${fileName} file (${mimeType}) that could not be processed.`
    return Buffer.from(fallbackInfo, 'utf8').toString('base64')
  }
}

function createAnthropicContent(fileData: string, mimeType: string): any {
  if (mimeType.startsWith('image/')) {
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType,
        data: fileData
      }
    }
  }
  
  if (mimeType === 'application/pdf') {
    return {
      type: "document",
      source: {
        type: "base64",
        media_type: mimeType,
        data: fileData
      }
    }
  }
  
  const textContent = Buffer.from(fileData, 'base64').toString('utf8')
  return {
    type: "text",
    text: textContent
  }
}

function processUserMessage(content: any[], provider: "anthropic" | "openai"): HumanMessage | null {
  const textParts = content.filter((p) => p.type === "text").map((p: any) => p.text)
  const fileAttachments = content.filter((p) => p.type === "file-attachment") as any[]
  
  const userText = textParts.join("\n\n")
  
  if (fileAttachments.length > 0) {
    if (provider === "anthropic") {
      const anthropicContent: any[] = []
      
      if (userText) anthropicContent.push({ type: "text", text: userText })
      
      for (const fa of fileAttachments) {
        if (!fa.fileData || !fa.mimeType) continue
        
        let anthropicMimeType = normalizeMimeType(fa.mimeType, fa.fileName)
        
        if (OFFICE_DOCUMENT_TYPES.includes(anthropicMimeType)) {
          anthropicMimeType = 'text/plain'
          fa.fileData = processOfficeDocument(fa.fileData, fa.mimeType, fa.fileName)
        }
        
        anthropicContent.push(createAnthropicContent(fa.fileData, anthropicMimeType))
      }
      
      return new HumanMessage({ content: anthropicContent })
    }
    
    const attachmentSummary = fileAttachments
      .map((fa) => {
        const sizeEstimate = fa?.fileData ? ` (~${Math.round((fa.fileData.length * 3) / 4 / 1024)} KB)` : ''
        return `Attachment: ${fa?.fileName || 'Unnamed file'}${sizeEstimate}`
      })
      .join('\n')
    const combined = [userText, attachmentSummary].filter(Boolean).join('\n\n') || 'User attached files.'
    return new HumanMessage(combined)
  }
  
  if (userText) {
    return new HumanMessage(userText)
  }
  
  return null
}

function processAssistantMessage(content: any[]): BaseMessage[] {
  const textParts = content.filter((p) => p.type === "text").map((p: any) => p.text)
  const toolCalls = content.filter((p) => p.type === "tool-call") as any[]
  
  if (textParts.length === 0 && toolCalls.length === 0) return []
  
  // Only include tool calls that have completed results
  const completedToolCalls = toolCalls.filter((c: any) => c.result !== undefined)
  
  const messages: BaseMessage[] = []
  
  if (completedToolCalls.length > 0) {
    // For messages with tool calls, maintain the proper sequence:
    // 1. Assistant message with tool_calls
    // 2. Tool result messages
    
    messages.push(new AIMessage({ 
      content: textParts.join("\n\n"), 
      tool_calls: completedToolCalls.map((c: any) => ({ 
        name: c.toolName, 
        args: c.args, 
        id: c.toolCallId 
      }))
    }))
    
    // Add tool result messages immediately after
    for (const toolCall of completedToolCalls) {
      messages.push(new ToolMessage({
        content: typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result),
        tool_call_id: toolCall.toolCallId
      }))
    }
  } else if (textParts.length > 0) {
    // If there are only text parts (no completed tool calls), just add the text message
    messages.push(new AIMessage({ 
      content: textParts.join("\n\n")
    }))
  }
  
  return messages
}

export function toLangChainMessages(messages: AssistantUiMessage[], provider: "anthropic" | "openai"): BaseMessage[] {
  const lc: BaseMessage[] = []
  
  for (const msg of messages) {
    if (msg.role === "system") {
      const text = msg.content
        .filter((p) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n\n")
      if (text) lc.push(new SystemMessage(text))
      continue
    }
    
    if (msg.role === "user") {
      const userMessage = processUserMessage(msg.content, provider)
      if (userMessage) lc.push(userMessage)
      continue
    }
    
    if (msg.role === "assistant") {
      const assistantMessages = processAssistantMessage(msg.content)
      lc.push(...assistantMessages)
    }
  }
  
  return lc
}

