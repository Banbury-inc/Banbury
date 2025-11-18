import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useVercelUseChatRuntime } from '@assistant-ui/react-ai-sdk';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { useLangGraphAssistant } from '../hooks/useLangGraphAssistant';

interface LangGraphContextType {
  isLangGraphMode: boolean;
  setLangGraphMode: (enabled: boolean) => void;
  langGraphState?: {
    messages: any[];
    isLoading: boolean;
    error: string | null;
    threadId: string;
    toolsInProgress: string[];
    sendMessage: (content: string, attachments?: any[], toolPreferences?: any) => Promise<void>;
    stopGeneration: () => void;
    clearConversation: () => void;
    retryLastMessage: () => Promise<void>;
  };
}

const LangGraphContext = createContext<LangGraphContextType | undefined>(undefined);

export const useLangGraphContext = () => {
  const context = useContext(LangGraphContext);
  if (!context) {
    throw new Error('useLangGraphContext must be used within LangGraphAssistantProvider');
  }
  return context;
};

interface LangGraphAssistantProviderProps {
  children: React.ReactNode;
  originalApiConfig: {
    api: string;
    headers?: Record<string, string>;
    body?: Record<string, any>;
  };
}

export const LangGraphAssistantProvider: React.FC<LangGraphAssistantProviderProps> = ({
  children,
  originalApiConfig
}) => {
  const [isLangGraphMode, setLangGraphMode] = useState(false);
  
  // Original assistant runtime
  const originalRuntime = useVercelUseChatRuntime({
    api: originalApiConfig.api,
    headers: originalApiConfig.headers,
    body: originalApiConfig.body,
  });

  // LangGraph assistant state
  const langGraphState = useLangGraphAssistant();

  // Sync LangGraph mode with tool preferences
  useEffect(() => {
    try {
      const toolPreferences = localStorage.getItem("toolPreferences");
      if (toolPreferences) {
        const prefs = JSON.parse(toolPreferences);
        if (prefs.langgraph_mode !== isLangGraphMode) {
          setLangGraphMode(prefs.langgraph_mode || false);
        }
      }
    } catch (error) {
      console.error('Error loading tool preferences:', error);
    }
  }, [isLangGraphMode]);

  // Update localStorage when LangGraph mode changes
  useEffect(() => {
    try {
      const toolPreferences = localStorage.getItem("toolPreferences");
      if (toolPreferences) {
        const prefs = JSON.parse(toolPreferences);
        prefs.langgraph_mode = isLangGraphMode;
        localStorage.setItem("toolPreferences", JSON.stringify(prefs));
      }
    } catch (error) {
      console.error('Error saving tool preferences:', error);
    }
  }, [isLangGraphMode]);

  const contextValue: LangGraphContextType = {
    isLangGraphMode,
    setLangGraphMode,
    langGraphState: isLangGraphMode ? langGraphState : undefined,
  };

  // Choose which runtime to use based on mode
  const activeRuntime = isLangGraphMode ? createLangGraphRuntime(langGraphState) : originalRuntime;

  return (
    <LangGraphContext.Provider value={contextValue}>
      <AssistantRuntimeProvider runtime={activeRuntime}>
        {children}
      </AssistantRuntimeProvider>
    </LangGraphContext.Provider>
  );
};

// Create a runtime adapter for LangGraph that mimics the Assistant UI runtime interface
function createLangGraphRuntime(langGraphState: any) {
  return {
    // Map LangGraph messages to Assistant UI format
    messages: langGraphState.messages.map((msg: any, index: number) => ({
      id: `msg-${index}`,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(),
    })),
    
    // Runtime state
    isRunning: langGraphState.isLoading,
    
    // Actions
    append: async (message: any) => {
      const textContent = message.content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join(' ');
      
      const attachments = message.content
        .filter((part: any) => part.type === 'file-attachment');
      
      // Get tool preferences from localStorage
      let toolPreferences = { web_search: true, tiptap_ai: true, memory: true, model_provider: "anthropic" as const };
      try {
        const saved = localStorage.getItem("toolPreferences");
        if (saved) {
          const prefs = JSON.parse(saved);
          toolPreferences = {
            web_search: prefs?.web_search !== false,
            tiptap_ai: prefs?.tiptap_ai !== false,
            memory: true, // Always enable memory for LangGraph
            model_provider: prefs?.model_provider === "openai" ? "openai" : "anthropic",
          };
        }
      } catch (error) {
        console.error('Error loading tool preferences:', error);
      }
      
      await langGraphState.sendMessage(textContent, attachments, toolPreferences);
    },
    
    // Other runtime methods
    reload: langGraphState.retryLastMessage,
    stop: langGraphState.stopGeneration,
    
    // Thread methods
    thread: {
      messages: langGraphState.messages,
      isRunning: langGraphState.isLoading,
    },
    
    // Composer methods
    composer: {
      isEditing: false,
      text: '',
      setText: () => {},
      reset: () => {},
    },
    
    // Capabilities
    capabilities: {
      reload: true,
      cancel: true,
      copy: true,
      edit: false, // Disable edit for now in LangGraph mode
      feedback: false,
    }
  };
}
