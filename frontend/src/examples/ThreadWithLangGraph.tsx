import React from 'react';
import { Thread } from '../components/thread';
import { AssistantProvider } from '../components/AssistantProvider';

interface ThreadWithLangGraphProps {
  userInfo: {
    username: string;
    email?: string;
  } | null;
  selectedFile?: any | null;
}

/**
 * Example component showing how to use the Thread component with LangGraph integration
 * 
 * Usage:
 * 1. Wrap your Thread component with AssistantProvider
 * 2. The AssistantProvider automatically switches between original and LangGraph APIs
 * 3. Users can toggle LangGraph mode via the tools dropdown in the Thread component
 */
export const ThreadWithLangGraph: React.FC<ThreadWithLangGraphProps> = ({
  userInfo,
  selectedFile
}) => {
  return (
    <AssistantProvider userInfo={userInfo}>
      <Thread userInfo={userInfo} selectedFile={selectedFile} />
    </AssistantProvider>
  );
};

export default ThreadWithLangGraph;
