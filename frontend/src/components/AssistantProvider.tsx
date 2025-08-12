import React, { useEffect, useState } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useVercelUseChatRuntime } from '@assistant-ui/react-ai-sdk';

interface AssistantProviderProps {
  children: React.ReactNode;
  userInfo: {
    username: string;
    email?: string;
  } | null;
}

export const AssistantProvider: React.FC<AssistantProviderProps> = ({
  children,
  userInfo
}) => {
  const [toolPreferences, setToolPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem("toolPreferences");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { web_search: true, tiptap_ai: true, read_file: true, langgraph_mode: false };
  });

  // Listen for localStorage changes to sync tool preferences
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("toolPreferences");
        if (saved) {
          setToolPreferences(JSON.parse(saved));
        }
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
