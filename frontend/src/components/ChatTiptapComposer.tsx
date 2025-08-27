import React, { useEffect, useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';

// Using SuggestionOptions shape directly via Mention.configure
import { Placeholder } from '@tiptap/extension-placeholder';

import 'tippy.js/dist/tippy.css';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import tippy, { Instance as TippyInstance } from 'tippy.js';

import { ApiService } from '../services/apiService';
import { extractEmailContent } from '../utils/emailUtils';
import { buildFileTree, flattenFileTree, FileSystemItem } from '../utils/fileTreeUtils';

import type { Editor } from '@tiptap/core';
import type { SuggestionOptions } from '@tiptap/suggestion';

type ChatTiptapComposerProps = {
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>;
  userInfo: { username: string; email?: string } | null;
  onFileAttach: (file: FileSystemItem) => void;
  placeholder?: string;
  className?: string;
  onSend?: () => void;
};

type FileMentionItem = {
  id: string;
  label: string;
  file: FileSystemItem;
};

// Helper function to get document editor content if available
const getDocumentEditorContent = (currentEditorDom?: Element | null): string => {
  try {
    // Look for document editor content - be very specific to avoid chat composers
    const documentEditors = Array.from(document.querySelectorAll('.ProseMirror[contenteditable="true"]'));
    
    for (const element of documentEditors) {
      // Skip if it's the current chat editor
      if (element === currentEditorDom) {
        continue;
      }
      
      // Check various document editor indicators
      const hasSimpleTiptapClass = element.classList.contains('simple-tiptap-editor') || 
                                   element.closest('.simple-tiptap-editor');
      const isInAITiptap = element.closest('.min-h-\\[600px\\]') || // AITiptapEditor specific class
                          element.closest('.bg-card');
      const isInWordViewer = element.closest('[class*="MuiBox"]') || // Material UI Box from WordViewer
                            element.closest('.h-full.border-0.rounded-none'); // TiptapWordEditor class
      
      // Skip if it's inside a chat composer area
      const isInChatComposer = element.closest('.bg-zinc-800') || 
                              element.closest('[aria-label*="Message input"]') ||
                              element.closest('[data-role="composer"]') ||
                              element.closest('.min-h-16'); // ChatTiptapComposer class
      
      
      
      if ((hasSimpleTiptapClass || isInAITiptap || isInWordViewer) && !isInChatComposer) {
        const content = element.textContent || '';
        // Only include if it has substantial content
        if (content.trim() && content.length > 20) {
          return `\n\nCurrent document content:\n${content}`;
        }
      }
    }
    
  } catch (e) {
    console.error('Error getting document content:', e);
  }
  
  return '';
};

export const ChatTiptapComposer: React.FC<ChatTiptapComposerProps> = ({ hiddenInputRef, userInfo, onFileAttach, placeholder = 'Send a message...', className, onSend }) => {
  const [files, setFiles] = React.useState<FileSystemItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const filesRef = React.useRef<FileSystemItem[]>([]);
  const loadingRef = React.useRef<boolean>(false);
  const [editor, setEditor] = React.useState<Editor | null>(null);

  const fetchFiles = React.useCallback(async () => {
    try {
      setLoading(true);
      if (!userInfo?.username) return;
      const result = await ApiService.getUserFiles(userInfo.username);
      if (result.success) {
        const tree = buildFileTree(result.files);
        const flat = flattenFileTree(tree).filter(f => f.type === 'file');
        setFiles(flat);
      }
    } catch {}
    finally { setLoading(false); }
  }, [userInfo?.username]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Keep refs in sync so suggestion reads current data without recreating editor
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Lightweight visual highlighter for any @token (plain text), excluding email addresses.
  const MentionHighlighter = useMemo(() => {
    return Extension.create({
      name: 'mentionHighlighter',
      addProseMirrorPlugins() {
        const createDecos = (doc: any) => {
          const decorations: any[] = [];
          // Pattern to match @mentions but only if there's a space before the @
          const pattern = /@[^\s]+/g;
          doc.descendants((node: any, pos: number) => {
            if (!node.isText) return;
            const text = node.text as string;
            let match;
            while ((match = pattern.exec(text)) !== null) {
              const from = pos + match.index;
              const to = from + match[0].length;
              
              // Only highlight if there's a space before the @ symbol
              const beforeMatch = text.substring(0, match.index);
              const hasSpaceBefore = beforeMatch.endsWith(' ') || beforeMatch === '';
              
              if (hasSpaceBefore) {
                decorations.push(Decoration.inline(from, to, { class: 'mention file-mention', 'data-type': 'mention' }));
              }
            }
          });
          return DecorationSet.create(doc, decorations);
        };
        const pluginKey = new PluginKey('mentionHighlighter');
        return [
          new Plugin({
            key: pluginKey,
            state: {
              init: (_: any, { doc }: any) => createDecos(doc),
              apply: (tr: any, set: DecorationSet) => {
                if (tr.docChanged) {
                  return createDecos(tr.doc);
                }
                return set;
              },
            },
            props: {
              decorations: (state: any) => pluginKey.getState(state) as DecorationSet,
            },
          }),
        ];
      },
    });
  }, []);



  const suggestionOptions = useMemo(() => {
    const render = () => {
      let component: HTMLDivElement | null = null;
      let popup: TippyInstance[] = [];
      let items: FileMentionItem[] = [];
      let selectedIndex = 0;
      let currentCommand: any = null;

      const updateSelection = () => {
        if (!component) return;
        const children = Array.from(component.querySelectorAll('[data-index]')) as HTMLDivElement[];
        children.forEach((el) => {
          el.classList.remove('bg-zinc-700');
        });
        const active = children[selectedIndex];
        if (active) {
          active.classList.add('bg-zinc-700');
        }
      };

      return {
        onStart(props: any) {
          currentCommand = props.command;
          component = document.createElement('div');
          component.className = 'bg-zinc-800 border-zinc-600 text-white shadow-xl min-w-[160px] border rounded-md overflow-hidden';
          component.style.maxHeight = '200px';
          component.style.overflowY = 'auto';
          component.style.zIndex = '999999';
          
          // Dark mode scrollbar
          component.style.scrollbarWidth = 'thin';
          component.style.scrollbarColor = '#52525b #27272a';
          
          // Webkit scrollbar styling and tippy override for Chrome/Safari
          const style = document.createElement('style');
          style.textContent = `
            .mention-dropdown::-webkit-scrollbar {
              width: 6px;
            }
            .mention-dropdown::-webkit-scrollbar-track {
              background: #27272a;
            }
            .mention-dropdown::-webkit-scrollbar-thumb {
              background: #52525b;
              border-radius: 3px;
            }
            .mention-dropdown::-webkit-scrollbar-thumb:hover {
              background: #71717a;
            }
            
            /* Override tippy default styling */
            .tippy-box[data-theme~='transparent'] {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              outline: none !important;
            }
            .tippy-box[data-theme~='transparent'] .tippy-content {
              padding: 0 !important;
              margin: 0 !important;
              background: transparent !important;
              border: none !important;
              outline: none !important;
            }
            .tippy-box[data-theme~='transparent'] .tippy-backdrop {
              display: none !important;
            }
            .tippy-box[data-theme~='transparent'] .tippy-svg-arrow {
              display: none !important;
            }
          `;
          if (!document.head.querySelector('#mention-scrollbar-styles')) {
            style.id = 'mention-scrollbar-styles';
            document.head.appendChild(style);
          }
          component.classList.add('mention-dropdown');

          popup = tippy('body', {
            getReferenceClientRect: () => (props.clientRect ? props.clientRect() : null) as any,
            appendTo: () => document.body,
            content: component!,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
            zIndex: 999999,
            theme: 'transparent',
            arrow: false,
            offset: [0, 8],
            hideOnClick: false,
            animation: false,
            duration: 0,
            maxWidth: 'none',
          }) as unknown as TippyInstance[];

          this.onUpdate(props);
        },

        onUpdate(props: any) {
          items = (props.items as FileMentionItem[]) || [];
          selectedIndex = 0;
          currentCommand = props.command;
          if (!component) return;
          component.innerHTML = '';
          if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'text-white hover:bg-zinc-700 focus:bg-zinc-700 px-3 py-2 text-sm text-zinc-400';
            empty.textContent = 'No matches';
            component.appendChild(empty);
          } else {
            items.forEach((item, index) => {
              const el = document.createElement('div');
              el.dataset.index = String(index);
              el.className = 'text-white hover:bg-zinc-700 focus:bg-zinc-700 px-3 py-2 text-sm cursor-pointer transition-colors truncate';
              el.textContent = item.label;
              el.title = item.label; // Show full name on hover
              el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                currentCommand(item);
              });
              component!.appendChild(el);
            });
          }
          updateSelection();
        },

        onKeyDown(props: any) {
          if (props.event.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % Math.max(items.length, 1);
            updateSelection();
            return true;
          }
          if (props.event.key === 'ArrowUp') {
            selectedIndex = (selectedIndex - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
            updateSelection();
            return true;
          }
          if (props.event.key === 'Enter') {
            if (items[selectedIndex] && typeof currentCommand === 'function') {
              currentCommand(items[selectedIndex]);
            }
            return true;
          }
          if (props.event.key === 'Escape') {
            // Close the dropdown without selecting anything
            popup.forEach(p => p.hide());
            return true;
          }
          return false;
        },

        onExit() {
          popup.forEach(p => p.destroy());
          popup = [];
          component = null;
        },
      } as any;
    };

    return {
      char: '@',
      startOfLine: false,
      allowSpaces: true,
      items: ({ query }: { query: string }) => {
        if (loadingRef.current) {
          return [{ id: 'loading', label: 'Loading files…', file: { id: 'loading', name: 'loading', type: 'file', path: 'loading' } as any }];
        }
        
        if (filesRef.current.length === 0) {
          return [{ id: 'no_files', label: 'No files found', file: { id: 'no_files', name: 'no_files', type: 'file', path: 'no_files' } as any }];
        }

        if (!query) {
          const base = filesRef.current.slice(0, 20).map((f) => ({ 
            id: f.file_id || f.id || f.path, 
            label: f.name, 
            file: f 
          }));
          return base;
        }
        
        const lower = query.toLowerCase();
        const matches = filesRef.current.filter((f) => 
          f.name.toLowerCase().includes(lower) || 
          f.path.toLowerCase().includes(lower)
        );
        const mapped = matches.slice(0, 20).map((f) => ({ 
          id: f.file_id || f.id || f.path, 
          label: f.name, 
          file: f 
        }));
        
        return mapped.length > 0 ? mapped : [{ 
          id: 'no_match', 
          label: 'No matches', 
          file: { id: 'no_match', name: 'no_match', type: 'file', path: 'no_match' } as any 
        }];
      },
      render,
      command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: FileMentionItem }) => {
        const item = props as FileMentionItem;
        if (item.id === 'loading' || item.id === 'no_files' || item.id === 'no_match') {
          // Ignore sentinel rows
          return;
        }

        // Insert the mention node and a space
        editor
          .chain()
          .insertContentAt(range, [
            { type: 'mention', attrs: { id: item.id, label: item.label } },
            { type: 'text', text: ' ' },
          ])
          .run();

        // Sync hidden input with a small delay to ensure editor state is updated
        setTimeout(() => {
          const el = hiddenInputRef.current;
          if (el) {
            const latest = editor.getText();
            el.value = latest;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new CustomEvent('tiptap-update', { bubbles: true, detail: { text: latest } }));
          }
        }, 10);

        onFileAttach(item.file);
      },
    } as unknown as SuggestionOptions;
  }, [onFileAttach]);

  const editorInstance = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      MentionHighlighter,
      Mention.configure({
        suggestion: suggestionOptions,
        HTMLAttributes: {
          class: 'mention file-mention',
          'data-type': 'mention',
        },
        renderText({ node }) {
          const label = node.attrs.label ?? node.attrs.id ?? '';
          return `@${label}`;
        },
        renderHTML({ node }) {
          const label = node.attrs.label ?? node.attrs.id ?? '';
          return ['span', {
            'data-id': node.attrs.id,
            'data-label': node.attrs.label,
            class: 'mention-chip-white',
          }, `@${label}`];
        },
      }),
    ],
    content: '',
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'min-h-16 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-base text-zinc-200 outline-none',
        'aria-label': placeholder,
        role: 'textbox',
        style: 'color-scheme: dark;',
      },
      handleKeyDown: (_view, event) => {
        // Check if suggestion dropdown is active (mention popup is open)
        const suggestionPopup = document.querySelector('[data-tippy-root]') as HTMLElement;
        if (suggestionPopup && suggestionPopup.style.display !== 'none') {
          // Let the suggestion handle Enter key
          return false;
        }
        
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          const el = hiddenInputRef.current;
          if (el) {
            // Get text from the chat composer
            const chatText = editorInstance?.getText() ?? '';

            // Get document editor content if available
            const documentContent = getDocumentEditorContent(editorInstance?.view.dom);

            // Only handle document content (docx files), email context is handled by thread.tsx handleSend
            if (documentContent) {
              localStorage.setItem('pendingDocumentContext', documentContent);
            } else {
              localStorage.removeItem('pendingDocumentContext');
            }

            // Update the UI input field
            el.value = chatText;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          // Call the send function if provided - this will trigger thread.tsx handleSend which merges email context
          if (onSend) {
            setTimeout(() => {
              onSend();
            }, 10);
          }
          return true;
        }
        // Single-backspace/delete behavior for mention chips
        if (event.key === 'Backspace' || event.key === 'Delete') {
          const ed = editorInstance;
          const state = ed?.state;
          if (!state) return false;
          const { selection } = state;
          // Only when selection is a caret
          if (!selection.empty) return false;
          const $pos = selection.$from;
          if (event.key === 'Backspace') {
            // If there's a single space before the caret and a mention before that, delete both
            try {
              const pos = $pos.pos;
              const hasSpaceBefore = pos > 0 && state.doc.textBetween(pos - 1, pos) === ' ';
              if (hasSpaceBefore) {
                event.preventDefault();
                ed?.commands.deleteRange({ from: pos - 1, to: pos });
                const state2 = ed?.state;
                if (state2) {
                  const $pos2 = state2.selection.$from;
                  const nodeBefore2 = ($pos2.nodeBefore as any);
                  if (nodeBefore2 && nodeBefore2.type && nodeBefore2.type.name === 'mention') {
                    const from = $pos2.pos - nodeBefore2.nodeSize;
                    const to = $pos2.pos;
                    ed?.commands.deleteRange({ from, to });
                    return true;
                  }
                }
                return true; // space deleted even if no mention followed
              }
            } catch {}
            const nodeBefore = $pos.nodeBefore as any;
            if (nodeBefore && nodeBefore.type && nodeBefore.type.name === 'mention') {
              event.preventDefault();
              const from = $pos.pos - nodeBefore.nodeSize;
              const to = $pos.pos;
              ed?.commands.deleteRange({ from, to });
              return true;
            }
          } else if (event.key === 'Delete') {
            const nodeAfter = $pos.nodeAfter as any;
            if (nodeAfter && nodeAfter.type && nodeAfter.type.name === 'mention') {
              event.preventDefault();
              const from = $pos.pos;
              const to = $pos.pos + nodeAfter.nodeSize;
              ed?.commands.deleteRange({ from, to });
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const el = hiddenInputRef.current;
      if (el) {
        // Get text including mentions - this should properly extract mention text
        const chatText = editor.getText();
        
        // For onUpdate, we'll just use the chat text without document content
        // to avoid constantly appending document content during typing.
        // Document content will only be added when sending (Enter key)
        el.value = chatText;
        
        // Dispatch multiple events to ensure the @assistant-ui library detects the change
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Force a re-render by dispatching a custom event
        el.dispatchEvent(new CustomEvent('tiptap-update', { bubbles: true, detail: { text: chatText } }));
        
        // Also trigger a composition event to simulate real typing
        el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: chatText }));
      }
    },
  }, []);

  // Set editor state and cleanup
  useEffect(() => {
    setEditor(editorInstance);
    if (editorInstance) {
      // Delay focus to ensure editor is fully mounted
      setTimeout(() => {
        try {
          editorInstance.commands.focus('end');
          // Initial sync with hidden input
          const el = hiddenInputRef.current;
          if (el) {
            const text = editorInstance.getText();
            el.value = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } catch (e) {
          // Ignore focus errors if editor not ready
        }
      }, 100);
    }
    return () => {
      editorInstance?.destroy();
    };
  }, [editorInstance]);

  // Allow external text injection (e.g., voice input) to populate the editor
  useEffect(() => {
    const handleSetText = (e: CustomEvent) => {
      const text = (e as any)?.detail?.text ?? '';
      if (!editorInstance) return;
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: text ? [{ type: 'text', text: String(text) }] : [],
          },
        ],
      } as any;
      try {
        editorInstance.commands.setContent(doc);
        setTimeout(() => {
          try { editorInstance.commands.focus('end'); } catch {}
        }, 0);
        const el = hiddenInputRef.current;
        if (el) {
          const latest = editorInstance.getText();
          el.value = latest;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new CustomEvent('tiptap-update', { bubbles: true, detail: { text: latest } }));
        }
      } catch {}
    };

    window.addEventListener('composer-set-text', handleSetText as EventListener);
    
    return () => {
      window.removeEventListener('composer-set-text', handleSetText as EventListener);
    };
  }, [editorInstance, hiddenInputRef]);


  return (
    <div className={className} onClick={() => editorInstance?.chain().focus().run()}>
      <EditorContent editor={editorInstance} />
    </div>
  );
};


