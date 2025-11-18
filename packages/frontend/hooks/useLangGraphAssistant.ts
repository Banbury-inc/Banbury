import { useState, useCallback, useRef } from 'react';
import { getDocumentContext } from '../assistant/ClaudeRuntimeProvider/handlers/getDocumentContext';
import { generateThreadId } from '../assistant/langraph/utils';
import { getDefaultModelForProvider, getModelById } from '../components/RightPanel/composer/handlers/getModelDisplayName';

// Types following athena-intelligence patterns
export interface ToolCall {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: any;
  argsText?: string;
  result?: any;
}

export interface TextContent {
  type: "text";
  text: string;
}

export interface FileAttachment {
  type: "file-attachment";
  fileId: string;
  fileName: string;
  filePath: string;
  fileData?: string;
  mimeType?: string;
}

export type MessagePart = TextContent | ToolCall | FileAttachment;

export interface Message {
  role: "system" | "user" | "assistant";
  content: MessagePart[];
  attachments?: any[];
}

export interface StreamEvent {
  type: "message-start" | "text-delta" | "tool-call" | "tool-result" | "message-end" | "error" | "done" | 
        "thinking" | "step-progression" | "tool-call-start" | "tool-status" | "tool-completion" | "completion-summary";
  role?: string;
  text?: string;
  part?: ToolCall;
  error?: string;
  status?: { type: string; reason: string };
  // New event properties
  message?: string;
  step?: number;
  totalSteps?: number;
  tool?: string;
  toolExecutions?: number;
  toolsUsed?: string[];
}

export interface AssistantState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  threadId: string;
  toolsInProgress: Set<string>;
  // New streaming state
  thinkingMessage?: string;
  currentStep?: number;
  totalSteps?: number;
  toolStatuses: Map<string, string>;
}

export interface ToolPreferences {
  web_search?: boolean;
  tiptap_ai?: boolean;
  memory?: boolean;
  model_provider?: "anthropic" | "openai";
  model_id?: string;
}

export function useLangGraphAssistant(initialThreadId?: string) {
  const [state, setState] = useState<AssistantState>({
    messages: [],
    isLoading: false,
    error: null,
    threadId: initialThreadId || generateThreadId(),
    toolsInProgress: new Set(),
    thinkingMessage: undefined,
    currentStep: undefined,
    totalSteps: undefined,
    toolStatuses: new Map()
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageRef = useRef<Message | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    attachments: FileAttachment[] = [],
    toolPreferences: ToolPreferences = { web_search: true, tiptap_ai: true, memory: true, model_provider: "anthropic" }
  ) => {
    if (state.isLoading) return;

    // Create user message
    const userMessage: Message = {
      role: "user",
      content: [
        { type: "text", text: content },
        ...attachments
      ]
    };

    // Update state with user message and loading
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
      toolsInProgress: new Set(),
      thinkingMessage: undefined,
      currentStep: undefined,
      totalSteps: undefined,
      toolStatuses: new Map()
    }));

    // Normalize tool preferences
    const modelProvider = toolPreferences?.model_provider === "openai" ? "openai" : "anthropic";
    const fallbackModelId = getDefaultModelForProvider(modelProvider);
    const rawModelId = typeof toolPreferences?.model_id === "string" ? toolPreferences.model_id : fallbackModelId;
    const modelId = getModelById(rawModelId)?.id || fallbackModelId;

    const normalizedToolPreferences: ToolPreferences = {
      web_search: toolPreferences?.web_search !== false,
      tiptap_ai: toolPreferences?.tiptap_ai !== false,
      memory: true,
      model_provider: modelProvider,
      model_id: modelId,
    };

    // Initialize assistant message
    currentMessageRef.current = {
      role: "assistant",
      content: []
    };

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const documentContext = getDocumentContext();

      // Call the LangGraph API endpoint
      const response = await fetch('/api/assistant/langgraph-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          messages: [...state.messages, userMessage],
          threadId: state.threadId,
          toolPreferences: normalizedToolPreferences,
          documentContext: documentContext || undefined
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              await handleStreamEvent(event);
            } catch (parseError) {
              console.error('Failed to parse stream event:', parseError);
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      const errorMessage = error?.message || 'An unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [state.messages, state.threadId, state.isLoading]);

  const handleStreamEvent = useCallback(async (event: StreamEvent) => {
    switch (event.type) {
      case "message-start":
        // Assistant message started
        currentMessageRef.current = {
          role: "assistant",
          content: []
        };
        // Append a placeholder assistant message so subsequent deltas update it
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, currentMessageRef.current!]
        }));
        break;

      case "thinking":
        // Update thinking message
        setState(prev => ({
          ...prev,
          thinkingMessage: event.message
        }));
        break;

      case "step-progression":
        // Update step progression
        setState(prev => ({
          ...prev,
          currentStep: event.step,
          totalSteps: event.totalSteps
        }));
        break;

      case "text-delta":
        if (event.text && currentMessageRef.current) {
          // Find existing text part or create new one
          const textParts = currentMessageRef.current.content.filter(p => p.type === "text") as TextContent[];
          if (textParts.length > 0) {
            textParts[0].text += event.text;
          } else {
            currentMessageRef.current.content.push({
              type: "text",
              text: event.text
            });
          }

          // Update state with current message
          setState(prev => ({
            ...prev,
            messages: [...prev.messages.slice(0, -1), currentMessageRef.current!]
          }));
        }
        break;

      case "tool-call":
        if (event.part && currentMessageRef.current) {
          currentMessageRef.current.content.push(event.part);
          
          // Add to tools in progress
          setState(prev => {
            const newToolsInProgress = new Set(prev.toolsInProgress);
            newToolsInProgress.add(event.part!.toolCallId);
            return {
              ...prev,
              messages: [...prev.messages.slice(0, -1), currentMessageRef.current!],
              toolsInProgress: newToolsInProgress
            };
          });
        }
        break;

      case "tool-call-start":
        if (event.part && currentMessageRef.current) {
          currentMessageRef.current.content.push(event.part);
          
          // Add to tools in progress
          setState(prev => {
            const newToolsInProgress = new Set(prev.toolsInProgress);
            newToolsInProgress.add(event.part!.toolCallId);
            return {
              ...prev,
              messages: [...prev.messages.slice(0, -1), currentMessageRef.current!],
              toolsInProgress: newToolsInProgress
            };
          });
        }
        break;

      case "tool-status":
        // Update tool status
        setState(prev => {
          const newToolStatuses = new Map(prev.toolStatuses);
          if (event.tool && event.message) {
            newToolStatuses.set(event.tool, event.message);
          }
          return {
            ...prev,
            toolStatuses: newToolStatuses
          };
        });
        break;

      case "tool-result":
        if (event.part && currentMessageRef.current) {
          // Find the tool call and update it with the result
          const toolCalls = currentMessageRef.current.content.filter(p => p.type === "tool-call") as ToolCall[];
          const toolCall = toolCalls.find(t => t.toolCallId === event.part!.toolCallId);
          if (toolCall) {
            toolCall.result = event.part.result;
          }

          // Remove from tools in progress
          setState(prev => {
            const newToolsInProgress = new Set(prev.toolsInProgress);
            newToolsInProgress.delete(event.part!.toolCallId);
            return {
              ...prev,
              messages: [...prev.messages.slice(0, -1), currentMessageRef.current!],
              toolsInProgress: newToolsInProgress
            };
          });
        }
        break;

      case "tool-completion":
        // Update tool status and remove from progress
        setState(prev => {
          const newToolStatuses = new Map(prev.toolStatuses);
          if (event.tool && event.message) {
            newToolStatuses.set(event.tool, event.message);
          }
          return {
            ...prev,
            toolStatuses: newToolStatuses
          };
        });
        break;

      case "message-end":
        if (currentMessageRef.current) {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages.slice(0, -1), currentMessageRef.current!],
            isLoading: false,
            toolsInProgress: new Set(),
            thinkingMessage: undefined,
            currentStep: undefined,
            totalSteps: undefined
          }));
        }
        currentMessageRef.current = null;
        break;

      case "completion-summary":
        // Could be used to show completion stats, for now just clear thinking state
        setState(prev => ({
          ...prev,
          thinkingMessage: undefined,
          currentStep: undefined,
          totalSteps: undefined
        }));
        break;

      case "error":
        setState(prev => ({
          ...prev,
          error: event.error || "An unknown error occurred",
          isLoading: false,
          toolsInProgress: new Set(),
          thinkingMessage: undefined,
          currentStep: undefined,
          totalSteps: undefined,
          toolStatuses: new Map()
        }));
        currentMessageRef.current = null;
        break;

      case "done":
        setState(prev => ({
          ...prev,
          isLoading: false,
          toolsInProgress: new Set(),
          thinkingMessage: undefined,
          currentStep: undefined,
          totalSteps: undefined,
          toolStatuses: new Map()
        }));
        break;
    }
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      toolsInProgress: new Set(),
      thinkingMessage: undefined,
      currentStep: undefined,
      totalSteps: undefined,
      toolStatuses: new Map()
    }));
  }, []);

  const clearConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
      threadId: generateThreadId(),
      toolsInProgress: new Set(),
      thinkingMessage: undefined,
      currentStep: undefined,
      totalSteps: undefined,
      toolStatuses: new Map()
    }));
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (state.messages.length === 0) return;

    // Find the last user message
    const lastUserMessage = [...state.messages].reverse().find(m => m.role === "user");
    if (!lastUserMessage) return;

    const textContent = lastUserMessage.content.find(p => p.type === "text") as TextContent;
    const attachments = lastUserMessage.content.filter(p => p.type === "file-attachment") as FileAttachment[];

    if (textContent) {
      // Remove messages after the last user message
      const lastUserIndex = state.messages.lastIndexOf(lastUserMessage);
      setState(prev => ({
        ...prev,
        messages: prev.messages.slice(0, lastUserIndex),
        error: null,
        thinkingMessage: undefined,
        currentStep: undefined,
        totalSteps: undefined,
        toolStatuses: new Map()
      }));

      // Resend the message
      await sendMessage(textContent.text, attachments);
    }
  }, [state.messages, sendMessage]);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    threadId: state.threadId,
    toolsInProgress: Array.from(state.toolsInProgress),
    // New streaming state
    thinkingMessage: state.thinkingMessage,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    toolStatuses: Array.from(state.toolStatuses.entries()).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>),
    
    // Actions
    sendMessage,
    stopGeneration,
    clearConversation,
    retryLastMessage
  };
}
