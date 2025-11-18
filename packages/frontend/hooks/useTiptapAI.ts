import { useRef, useCallback, useState } from 'react';

import type { Editor } from '@tiptap/react';

export interface TiptapAIAction {
  type: 'insert' | 'replace' | 'append' | 'prepend' | 'format' | 'rewrite' | 'improve' | 'summarize' | 'translate' | 'correct';
  content?: string;
  position?: { from: number; to: number };
  selection?: boolean; // Whether to use current selection
  format?: string; // For format actions like 'bold', 'italic', etc.
  language?: string; // For translation
  options?: Record<string, any>;
}

export interface TiptapAIBridge {
  executeAction: (action: TiptapAIAction) => Promise<boolean>;
  getContent: () => string;
  getSelection: () => { from: number; to: number; text: string } | null;
  setContent: (content: string) => void;
  insertContent: (content: string, position?: number) => void;
  replaceSelection: (content: string) => void;
  formatSelection: (format: string) => void;
  getContext: () => { content: string; selection: string; cursor: number };
}

export const useTiptapAI = (editor: Editor | null): TiptapAIBridge => {
  const [isExecuting, setIsExecuting] = useState(false);

  const executeAction = useCallback(async (action: TiptapAIAction): Promise<boolean> => {
    if (!editor || isExecuting) return false;
    
    setIsExecuting(true);
    
    try {
      switch (action.type) {
        case 'insert':
          if (action.content) {
            if (action.position) {
              editor.chain().focus().insertContentAt(action.position.from, action.content).run();
            } else {
              editor.chain().focus().insertContent(action.content).run();
            }
          }
          break;
          
        case 'replace':
          if (action.content) {
            if (action.selection || action.position) {
              const { from, to } = action.position || editor.state.selection;
              editor.chain().focus().deleteRange({ from, to }).insertContent(action.content).run();
            } else {
              editor.chain().focus().selectAll().insertContent(action.content).run();
            }
          }
          break;
          
        case 'append':
          if (action.content) {
            const docSize = editor.state.doc.content.size;
            editor.chain().focus().insertContentAt(docSize, action.content).run();
          }
          break;
          
        case 'prepend':
          if (action.content) {
            editor.chain().focus().insertContentAt(0, action.content).run();
          }
          break;
          
        case 'format':
          if (action.format) {
            switch (action.format) {
              case 'bold':
                editor.chain().focus().toggleBold().run();
                break;
              case 'italic':
                editor.chain().focus().toggleItalic().run();
                break;
              case 'underline':
                editor.chain().focus().toggleUnderline().run();
                break;
              case 'strike':
                editor.chain().focus().toggleStrike().run();
                break;
              case 'code':
                editor.chain().focus().toggleCode().run();
                break;
              case 'heading1':
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                break;
              case 'heading2':
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                break;
              case 'heading3':
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                break;
              case 'bulletList':
                editor.chain().focus().toggleBulletList().run();
                break;
              case 'orderedList':
                editor.chain().focus().toggleOrderedList().run();
                break;
              case 'blockquote':
                editor.chain().focus().toggleBlockquote().run();
                break;
              case 'codeBlock':
                editor.chain().focus().toggleCodeBlock().run();
                break;
            }
          }
          break;
          
        case 'rewrite':
        case 'improve':
        case 'summarize':
        case 'translate':
        case 'correct':
          if (action.content) {
            if (action.selection) {
              editor.chain().focus().deleteSelection().insertContent(action.content).run();
            } else {
              editor.chain().focus().selectAll().insertContent(action.content).run();
            }
          }
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Error executing Tiptap AI action:', error);
      return false;
    } finally {
      setIsExecuting(false);
    }
  }, [editor, isExecuting]);

  const getContent = useCallback((): string => {
    return editor?.getHTML() || '';
  }, [editor]);

  const getSelection = useCallback((): { from: number; to: number; text: string } | null => {
    if (!editor) return null;
    
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    
    return { from, to, text };
  }, [editor]);

  const setContent = useCallback((content: string): void => {
    editor?.commands.setContent(content);
  }, [editor]);

  const insertContent = useCallback((content: string, position?: number): void => {
    if (position !== undefined) {
      editor?.chain().focus().insertContentAt(position, content).run();
    } else {
      editor?.chain().focus().insertContent(content).run();
    }
  }, [editor]);

  const replaceSelection = useCallback((content: string): void => {
    editor?.chain().focus().deleteSelection().insertContent(content).run();
  }, [editor]);

  const formatSelection = useCallback((format: string): void => {
    executeAction({ type: 'format', format });
  }, [executeAction]);

  const getContext = useCallback(() => {
    if (!editor) return { content: '', selection: '', cursor: 0 };
    
    const content = editor.getHTML();
    const selection = getSelection();
    const cursor = editor.state.selection.from;
    
    return {
      content,
      selection: selection?.text || '',
      cursor
    };
  }, [editor, getSelection]);

  return {
    executeAction,
    getContent,
    getSelection,
    setContent,
    insertContent,
    replaceSelection,
    formatSelection,
    getContext
  };
};
