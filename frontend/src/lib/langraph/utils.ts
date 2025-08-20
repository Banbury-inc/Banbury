import { BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

// Thread ID generation following athena-intelligence patterns
export function generateThreadId(channelId?: string, timestamp?: string): string {
  const crypto = require('crypto');
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID namespace for DNS
  const input = `BANBURY:${timestamp || Date.now()}-${channelId || 'web'}`;
  
  // Simple UUID v5 implementation
  const hash = crypto.createHash('sha1').update(namespace + input).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16), // Version 5
    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join('-');
}

// Message formatting utilities
export function formatMessageForContext(message: BaseMessage, userNames?: Record<string, string>): string {
  const type = message._getType();
  const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
  
  switch (type) {
    case 'human':
      return `<userMessage>${content}</userMessage>`;
    case 'ai':
      return `<assistantMessage>${content}</assistantMessage>`;
    case 'system':
      return `<systemMessage>${content}</systemMessage>`;
    case 'tool':
      const toolMsg = message as ToolMessage;
      return `<toolResult toolId="${toolMsg.tool_call_id}">${content}</toolResult>`;
    default:
      return `<message type="${type}">${content}</message>`;
  }
}

// Build contextual messages with thread history
export function buildContextualMessage(
  messages: BaseMessage[],
  maxMessages: number = 10
): string {
  const recentMessages = messages.slice(-maxMessages);
  const contextParts = recentMessages.map(msg => formatMessageForContext(msg));
  
  if (contextParts.length === 0) {
    return "";
  }
  
  const newMessage = contextParts[contextParts.length - 1];
  const precedingContext = contextParts.slice(0, -1).join('\n');
  
  return (
    (precedingContext ? `Preceding context:\n${precedingContext}\n\n` : '') +
    `New message:\n${newMessage}`
  );
}

// Tool execution utilities
export interface ToolResult {
  toolCallId: string;
  toolName: string;
  args: any;
  result: any;
  error?: string;
}

export function formatToolResults(results: ToolResult[]): string {
  if (results.length === 0) return "";
  
  return results.map(result => {
    if (result.error) {
      return `Tool ${result.toolName} failed: ${result.error}`;
    }
    
    const resultStr = typeof result.result === 'string' 
      ? result.result 
      : JSON.stringify(result.result);
    
    return `Tool ${result.toolName} result: ${resultStr}`;
  }).join('\n\n');
}

// Session management
export class SessionManager {
  private sessions = new Map<string, {
    messages: BaseMessage[];
    metadata: Record<string, any>;
    lastActivity: number;
  }>();
  
  private readonly SESSION_TIMEOUT = 1000 * 60 * 60 * 24; // 24 hours
  
  createSession(sessionId: string, metadata: Record<string, any> = {}): void {
    this.sessions.set(sessionId, {
      messages: [],
      metadata: {
        ...metadata,
        createdAt: Date.now(),
        backend_parallel_functioncalling: false,
        frontend_parallel_functioncalling: false,
        enabled_tools: [
          "web_search",
          "tiptap_ai", 
          "store_memory",
          "search_memory",
          "search_files"
        ],
        model: "claude-sonnet-4-20250514",
        system_prompt: "You are Athena, a helpful AI assistant built by Banbury. " +
          "You are highly capable and focused on providing clear, accurate, and helpful responses. " +
          "Break down complex problems into manageable steps, provide practical solutions, " +
          "maintain a professional yet friendly tone, and always prioritize accuracy over speculation. " +
          "You have access to file search to find files in the user's cloud storage.",
        temperature: 0.2,
        memory_collector_enabled: true,
        memory_injection_enabled: true,
        max_past_messages_for_subagents: 10,
        message_trimming: true
      },
      lastActivity: Date.now()
    });
  }
  
  getSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    // Check if session has expired
    if (Date.now() - session.lastActivity > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    return session;
  }
  
  updateSession(sessionId: string, messages: BaseMessage[], metadata?: Record<string, any>): void {
    const session = this.getSession(sessionId);
    if (!session) return;
    
    session.messages = messages;
    session.lastActivity = Date.now();
    if (metadata) {
      session.metadata = { ...session.metadata, ...metadata };
    }
  }
  
  addMessage(sessionId: string, message: BaseMessage): void {
    const session = this.getSession(sessionId);
    if (!session) return;
    
    session.messages.push(message);
    session.lastActivity = Date.now();
    
    // Trim messages if too many (keep last 50)
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-50);
    }
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();

// Memory utilities are now handled by the backend API
// See agent.ts for the integrated memory tools

// Cleanup interval (run every hour)
setInterval(() => {
  sessionManager.cleanup();
}, 1000 * 60 * 60);
