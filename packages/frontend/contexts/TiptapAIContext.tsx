import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

import { useTiptapAI, type TiptapAIAction, type TiptapAIBridge } from '../hooks/useTiptapAI';
import { setCurrentTiptapEditor } from '../components/RightPanel/handlers/handle-docx-ai-response';

import type { Editor } from '@tiptap/react';

interface TiptapAIContextType {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  aiBridge: TiptapAIBridge | null;
  executeAIAction: (action: TiptapAIAction) => Promise<boolean>;
  isConnected: boolean;
  registerAICommands: () => void;
  aiCommands: AICommand[];
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
  previewContent: { originalContent: string; newContent: string } | null;
  setPreviewContent: (content: { originalContent: string; newContent: string } | null) => void;
  acceptPreview: () => void;
  rejectPreview: () => void;
}

interface AICommand {
  id: string;
  name: string;
  description: string;
  category: 'editing' | 'formatting' | 'content' | 'analysis';
  execute: (params?: Record<string, any>) => Promise<void>;
}

const TiptapAIContext = createContext<TiptapAIContextType | null>(null);

export const useTiptapAIContext = () => {
  const context = useContext(TiptapAIContext);
  if (!context) {
    throw new Error('useTiptapAIContext must be used within TiptapAIProvider');
  }
  return context;
};

interface TiptapAIProviderProps {
  children: React.ReactNode;
}

export const TiptapAIProvider: React.FC<TiptapAIProviderProps> = ({ children }) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ originalContent: string; newContent: string } | null>(null);
  const aiBridge = useTiptapAI(editor);
  const commandsRef = useRef<AICommand[]>([]);

  // Update global editor reference when editor changes
  useEffect(() => {
    setCurrentTiptapEditor(editor);
  }, [editor]);

  const acceptPreview = useCallback(() => {
    if (!editor || !previewContent) return;
    
    // Apply the new content
    editor.commands.setContent(previewContent.newContent);
    
    // Clear preview state
    setPreviewMode(false);
    setPreviewContent(null);
  }, [editor, previewContent]);

  const rejectPreview = useCallback(() => {
    if (!editor || !previewContent) return;
    
    // Restore original content
    editor.commands.setContent(previewContent.originalContent);
    
    // Clear preview state
    setPreviewMode(false);
    setPreviewContent(null);
  }, [editor, previewContent]);

  const executeAIAction = useCallback(async (action: TiptapAIAction): Promise<boolean> => {
    if (!aiBridge) return false;
    return await aiBridge.executeAction(action);
  }, [aiBridge]);

  const registerAICommands = useCallback(() => {
    const commands: AICommand[] = [
      {
        id: 'rewrite-selection',
        name: 'Rewrite Selection',
        description: 'Rewrite the selected text to improve clarity and style',
        category: 'editing',
        execute: async (params) => {
          const selection = aiBridge?.getSelection();
          if (!selection || !selection.text.trim()) return;
          
          // This will be handled by the AI assistant
          const message = `Please rewrite the following text to improve clarity and style:\n\n"${selection.text}"`;
          
          // Trigger AI assistant with this message
          window.dispatchEvent(new CustomEvent('tiptap-ai-request', {
            detail: { 
              message,
              action: 'rewrite',
              selection: selection
            }
          }));
        }
      },
      {
        id: 'improve-grammar',
        name: 'Improve Grammar',
        description: 'Fix grammar and spelling errors in the selected text',
        category: 'editing',
        execute: async (params) => {
          const selection = aiBridge?.getSelection();
          if (!selection || !selection.text.trim()) return;
          
          const message = `Please fix any grammar and spelling errors in the following text:\n\n"${selection.text}"`;
          
          window.dispatchEvent(new CustomEvent('tiptap-ai-request', {
            detail: { 
              message,
              action: 'correct',
              selection: selection
            }
          }));
        }
      },
      {
        id: 'summarize-content',
        name: 'Summarize Content',
        description: 'Create a summary of the selected text or entire document',
        category: 'analysis',
        execute: async (params) => {
          const selection = aiBridge?.getSelection();
          const content = selection?.text || aiBridge?.getContent() || '';
          
          if (!content.trim()) return;
          
          const message = `Please create a concise summary of the following content:\n\n"${content}"`;
          
          window.dispatchEvent(new CustomEvent('tiptap-ai-request', {
            detail: { 
              message,
              action: 'summarize',
              selection: selection
            }
          }));
        }
      },
      {
        id: 'expand-content',
        name: 'Expand Content',
        description: 'Expand the selected text with more details and examples',
        category: 'content',
        execute: async (params) => {
          const selection = aiBridge?.getSelection();
          if (!selection || !selection.text.trim()) return;
          
          const message = `Please expand the following text with more details, examples, and explanations:\n\n"${selection.text}"`;
          
          window.dispatchEvent(new CustomEvent('tiptap-ai-request', {
            detail: { 
              message,
              action: 'expand',
              selection: selection
            }
          }));
        }
      },
      {
        id: 'make-professional',
        name: 'Make Professional',
        description: 'Rewrite text in a more professional tone',
        category: 'editing',
        execute: async (params) => {
          const selection = aiBridge?.getSelection();
          if (!selection || !selection.text.trim()) return;
          
          const message = `Please rewrite the following text in a more professional and formal tone:\n\n"${selection.text}"`;
          
          window.dispatchEvent(new CustomEvent('tiptap-ai-request', {
            detail: { 
              message,
              action: 'rewrite',
              selection: selection
            }
          }));
        }
      },
      {
        id: 'make-casual',
        name: 'Make Casual',
        description: 'Rewrite text in a more casual and friendly tone',
        category: 'editing',
        execute: async (params) => {
          const selection = aiBridge?.getSelection();
          if (!selection || !selection.text.trim()) return;
          
          const message = `Please rewrite the following text in a more casual and friendly tone:\n\n"${selection.text}"`;
          
          window.dispatchEvent(new CustomEvent('tiptap-ai-request', {
            detail: { 
              message,
              action: 'rewrite',
              selection: selection
            }
          }));
        }
      },
      {
        id: 'translate-text',
        name: 'Translate Text',
        description: 'Translate selected text to another language',
        category: 'content',
        execute: async (params) => {
          const selection = aiBridge?.getSelection();
          if (!selection || !selection.text.trim()) return;
          
          const language = params?.language || 'Spanish';
          const message = `Please translate the following text to ${language}:\n\n"${selection.text}"`;
          
          window.dispatchEvent(new CustomEvent('tiptap-ai-request', {
            detail: { 
              message,
              action: 'translate',
              selection: selection,
              language: language
            }
          }));
        }
      },
      {
        id: 'generate-outline',
        name: 'Generate Outline',
        description: 'Create an outline for the document content',
        category: 'content',
        execute: async (params) => {
          const content = aiBridge?.getContent() || '';
          
          if (!content.trim()) return;
          
          const message = `Please create a detailed outline for the following content:\n\n"${content}"`;
          
          window.dispatchEvent(new CustomEvent('tiptap-ai-request', {
            detail: { 
              message,
              action: 'outline',
              selection: null
            }
          }));
        }
      }
    ];
    
    commandsRef.current = commands;
  }, [aiBridge]);

  const value: TiptapAIContextType = {
    editor,
    setEditor,
    aiBridge,
    executeAIAction,
    isConnected: !!editor && !!aiBridge,
    registerAICommands,
    aiCommands: commandsRef.current,
    previewMode,
    setPreviewMode,
    previewContent,
    setPreviewContent,
    acceptPreview,
    rejectPreview
  };

  return (
    <TiptapAIContext.Provider value={value}>
      {children}
    </TiptapAIContext.Provider>
  );
};

// Global function to handle AI responses and apply them to the editor
export const handleAIResponse = (response: string, actionType: string, selection?: { from: number; to: number; text: string }) => {
  window.dispatchEvent(new CustomEvent('tiptap-ai-response', {
    detail: {
      response,
      actionType,
      selection
    }
  }));
};
