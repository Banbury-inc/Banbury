import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useVercelUseChatRuntime } from '@assistant-ui/react-ai-sdk';
import React, { useEffect, useState } from 'react';

interface AssistantProviderProps {
  children: React.ReactNode;
  userInfo: {
    username: string;
    email?: string;
  } | null;
}

interface ToolPreferences {
  web_search: boolean
  tiptap_ai: boolean
  read_file: boolean
  gmail: boolean
  langgraph_mode: boolean
  browser: boolean
  x_api: boolean
  slack: boolean
  model_provider: "anthropic" | "openai"
}

function normalizeToolPreferences(raw: any): ToolPreferences {
  const base = {
    web_search: true,
    tiptap_ai: true,
    read_file: true,
    gmail: true,
    langgraph_mode: false,
    browser: false,
    x_api: false,
    slack: false,
    model_provider: "anthropic" as const,
  }

  if (!raw || typeof raw !== "object") return base

  return {
    web_search: raw.web_search !== false,
    tiptap_ai: raw.tiptap_ai !== false,
    read_file: raw.read_file !== false,
    gmail: raw.gmail !== false,
    langgraph_mode: Boolean(raw.langgraph_mode),
    browser: Boolean(raw.browser),
    x_api: Boolean(raw.x_api),
    slack: Boolean(raw.slack),
    model_provider: raw.model_provider === "openai" ? "openai" : "anthropic",
  }
}

export const AssistantProvider: React.FC<AssistantProviderProps> = ({
  children,
  userInfo
}) => {
  const [toolPreferences, setToolPreferences] = useState<ToolPreferences>(() => {
    try {
      const saved = localStorage.getItem("toolPreferences");
      if (saved) return normalizeToolPreferences(JSON.parse(saved));
    } catch {}
    return normalizeToolPreferences(null);
  });

  // Listen for localStorage changes to sync tool preferences
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("toolPreferences");
        if (saved) setToolPreferences(normalizeToolPreferences(JSON.parse(saved)));
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes within the same tab
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Choose API endpoint based on LangGraph mode
  const apiEndpoint = toolPreferences.langgraph_mode 
    ? '/api/assistant/langgraph-stream'
    : '/api/assistant/stream';

  const runtime = useVercelUseChatRuntime({
    api: apiEndpoint,
    headers: userInfo?.email ? {
      'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
    } : {},
    body: {
      toolPreferences,
      userInfo
    },
    onError: (error) => {
      console.error('Assistant runtime error:', error);
    }
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};
