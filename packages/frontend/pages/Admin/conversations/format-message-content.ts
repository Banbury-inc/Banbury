/**
 * Represents a content part within a message (AssistantUI format)
 */
export interface MessageContentPart {
  type: 'text' | 'tool-call' | 'tool-result' | 'file-attachment' | string
  text?: string
  toolName?: string
  toolCallId?: string
  args?: unknown
  argsText?: string
  result?: unknown
  [key: string]: unknown
}

/**
 * Represents a message in an AI conversation
 * Content can be:
 * - A plain string
 * - An object with a `text` property (and optionally a `type`)
 * - An array of MessageContentPart objects (AssistantUI format)
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | string
  content?: string | MessageContentPart[] | { text?: string; type?: string; [key: string]: unknown } | unknown
  text?: string // fallback for older message formats
  timestamp?: string
  id?: string
}

/**
 * Result from formatting a message content for display
 */
export interface FormattedContent {
  kind: 'text' | 'json'
  text: string
}

/**
 * Attempts to parse a string as JSON
 * Returns undefined if parsing fails or the input is not a JSON-like string
 */
export function tryParseJson(text: string): unknown | undefined {
  const trimmed = text.trim()
  // Only try to parse if it looks like JSON (starts with { or [)
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return undefined
  
  try {
    return JSON.parse(trimmed)
  } catch {
    return undefined
  }
}

/**
 * Extracts the primary text content from a message
 * Handles various content formats:
 * - String content
 * - Object with text property
 * - Array of content parts (joins text parts)
 */
export function extractMessageText(message: ConversationMessage): string | undefined {
  const content = message.content ?? message.text
  
  if (content === undefined || content === null) return undefined
  
  // Plain string
  if (typeof content === 'string') return content
  
  // Array of parts (AssistantUI format)
  if (Array.isArray(content)) {
    const textParts = content
      .filter((part): part is MessageContentPart => 
        part && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string'
      )
      .map(part => part.text)
    
    return textParts.length > 0 ? textParts.join('\n') : undefined
  }
  
  // Object with text property
  if (typeof content === 'object') {
    const obj = content as { text?: string; type?: string }
    if (typeof obj.text === 'string') return obj.text
  }
  
  return undefined
}

/**
 * Formats message content for display
 * - Returns plain text if content is a simple string
 * - Returns pretty-printed JSON if content is an object or valid JSON string
 * - Tries to extract text from structured content first
 */
export function formatMessageContent(message: ConversationMessage): FormattedContent {
  const content = message.content ?? message.text
  
  // No content
  if (content === undefined || content === null) {
    return { kind: 'text', text: 'No content' }
  }
  
  // Plain string - check if it's JSON
  if (typeof content === 'string') {
    const parsed = tryParseJson(content)
    if (parsed !== undefined) {
      return { kind: 'json', text: JSON.stringify(parsed, null, 2) }
    }
    return { kind: 'text', text: content }
  }
  
  // Array of parts - try to extract text first
  if (Array.isArray(content)) {
    const text = extractMessageText(message)
    if (text) return { kind: 'text', text }
    // If no text parts, format the whole array as JSON
    return { kind: 'json', text: JSON.stringify(content, null, 2) }
  }
  
  // Object - try to extract text, otherwise format as JSON
  if (typeof content === 'object') {
    const obj = content as { text?: string; type?: string }
    
    // If it has a text property, return that as text
    if (typeof obj.text === 'string') {
      return { kind: 'text', text: obj.text }
    }
    
    // Otherwise format the entire object as JSON
    return { kind: 'json', text: JSON.stringify(content, null, 2) }
  }
  
  // Fallback - convert to string
  return { kind: 'text', text: String(content) }
}

/**
 * Gets a display label for a message role
 */
export function getRoleLabel(role: string): string {
  switch (role) {
    case 'user':
      return 'User'
    case 'assistant':
      return 'AI Assistant'
    case 'system':
      return 'System'
    default:
      return role.charAt(0).toUpperCase() + role.slice(1)
  }
}
