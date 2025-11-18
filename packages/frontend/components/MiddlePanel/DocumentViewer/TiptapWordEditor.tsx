import React, { useEffect } from 'react';

import { useTiptapAIContext } from '../../../contexts/TiptapAIContext';
import { AITiptapEditor } from './AITiptapEditor';

interface TiptapWordEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  onSave?: () => void;
  onDownload?: () => void;
  saving?: boolean;
  canSave?: boolean;
}

const TiptapWordEditor: React.FC<TiptapWordEditorProps> = ({
  initialContent = '',
  onContentChange,
  placeholder = 'Start typing...',
  onSave,
  onDownload,
  saving,
  canSave
}) => {
  const { registerAICommands } = useTiptapAIContext();

  // Listen for AI requests from the assistant and inject them into the chat
  useEffect(() => {
    const handleAIRequest = (event: CustomEvent) => {
      const { message, action, selection } = event.detail;
      
      // Auto-focus on the assistant panel and inject the message
      setTimeout(() => {
        const composerInput = document.querySelector('[aria-label="Message input"]') as HTMLTextAreaElement;
        if (composerInput) {
          const enhancedMessage = `Please help me with the following document editing task:

${message}

${selection ? `\nSelected text: "${selection.text}"` : ''}

Please provide your response in HTML format that can be directly applied to the document editor. Use the tiptap_ai tool to deliver your response so it can be applied to the document automatically.`;
          
          composerInput.value = enhancedMessage;
          composerInput.focus();
          
          // Trigger input event to update the composer
          const inputEvent = new Event('input', { bubbles: true });
          composerInput.dispatchEvent(inputEvent);
        }
      }, 100);
    };

    window.addEventListener('tiptap-ai-request', handleAIRequest as EventListener);
    
    return () => {
      window.removeEventListener('tiptap-ai-request', handleAIRequest as EventListener);
    };
  }, []);

  return (
    <AITiptapEditor 
      initialContent={initialContent}
      onContentChange={onContentChange}
      placeholder={placeholder}
      className="h-full border-0 rounded-none"
      onSave={onSave}
      onDownload={onDownload}
      saving={saving}
      canSave={canSave}
    />
  );
};

export default TiptapWordEditor;
