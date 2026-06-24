import { Highlight } from '@tiptap/extension-highlight';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { ResizableImage } from '../../extensions/ResizableImage';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-list';
import { TaskItem } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { Underline } from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Insertion, Deletion } from '../../../extensions/TrackChanges';
import React, { useEffect, useMemo, useRef, useState } from 'react';


import styles from '../../../styles/SimpleTiptapEditor.module.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../../common/ui/dropdown-menu';
import { useTiptapAIContext } from '../../../contexts/TiptapAIContext';
import { cn } from '../../../utils';
import { registerTiptapEditor, unregisterTiptapEditor, isShowingPreview } from '../../RightPanel/handlers/handle-docx-ai-response';
import { createToolbarHandlers } from './handlers/toolbarHandlers';
import { BoldButton } from './components/BoldButton';
import { ItalicButton } from './components/ItalicButton';
import { UnderlineButton } from './components/UnderlineButton';
import { StrikethroughButton } from './components/StrikethroughButton';
import { CodeButton } from './components/CodeButton';
import { HighlightButton } from './components/HighlightButton';
import { SubscriptButton } from './components/SubscriptButton';
import { SuperscriptButton } from './components/SuperscriptButton';
import { BulletListButton } from './components/BulletListButton';
import { OrderedListButton } from './components/OrderedListButton';
import { QuoteButton } from './components/QuoteButton';
import { TableButton } from './components/TableButton';
import { LinkButton } from './components/LinkButton';
import { UndoButton } from './components/UndoButton';
import { RedoButton } from './components/RedoButton';
import { ImageButton } from './components/ImageButton';
import { DocumentActionButtons } from './components/DocumentActionButtons';
import { OverflowButton } from './components/OverflowButton';

interface AITiptapEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  onSave?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  saving?: boolean;
  canSave?: boolean;
}

export const AITiptapEditor: React.FC<AITiptapEditorProps> = ({
  initialContent = '<p>Start typing...</p>',
  onContentChange,
  placeholder = 'Start typing...',
  className,
  onSave,
  onDownload,
  onShare,
  saving = false,
  canSave = false
}) => {
  const { setEditor, registerAICommands } = useTiptapAIContext();

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    isTable: boolean;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isTable: false,
  });

  // Image dropdown local search state
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false)
  const [selectedFont, setSelectedFont] = useState<string | null>(null)

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.isOpen) {
        setContextMenu(prev => ({ ...prev, isOpen: false }))
      }
    }

    if (contextMenu.isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.isOpen])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      HorizontalRule,
      TextStyle,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
        handleWidth: 8,
        cellMinWidth: 50,
        lastColumnResizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({
        multicolor: true,
      }),
      Insertion,
      Deletion,
      ResizableImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'image-resizable',
        },
      }),
      Typography,
      Superscript,
      Subscript,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Don't save content changes when showing diff preview
      if (onContentChange && !isShowingPreview()) {
        onContentChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: styles['simple-tiptap-editor'],
        'aria-label': placeholder,
      },
    },
  });

  // Responsive toolbar calculation (visible vs overflow)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const leftToolbarRef = useRef<HTMLDivElement | null>(null)
  const rightActionsRef = useRef<HTMLDivElement | null>(null)
  const [visibleButtons, setVisibleButtons] = useState<string[]>([])
  const [overflowOpen, setOverflowOpen] = useState(false)

  const handlers = useMemo(() => createToolbarHandlers({ editor, setIsImageMenuOpen }), [editor])

  const toolbarButtons = useMemo(() => (
    [
      { id: 'undo', title: 'Undo', onClick: handlers.undo },
      { id: 'redo', title: 'Redo', onClick: handlers.redo },
      { id: 'bold', title: 'Bold', onClick: handlers.toggleBold },
      { id: 'italic', title: 'Italic', onClick: handlers.toggleItalic },
      { id: 'underline', title: 'Underline', onClick: handlers.toggleUnderline },
      { id: 'strike', title: 'Strikethrough', onClick: handlers.toggleStrike },
      { id: 'code', title: 'Code', onClick: handlers.toggleCode },
      { id: 'highlight', title: 'Highlight', onClick: handlers.toggleHighlight },
      { id: 'subscript', title: 'Subscript', onClick: handlers.toggleSubscript },
      { id: 'superscript', title: 'Superscript', onClick: handlers.toggleSuperscript },
      { id: 'bullet', title: 'Bullet List', onClick: handlers.toggleBulletList },
      { id: 'ordered', title: 'Numbered List', onClick: handlers.toggleOrderedList },
      { id: 'quote', title: 'Quote', onClick: handlers.toggleBlockquote },
      { id: 'table', title: 'Insert Table', onClick: handlers.insertTable },
      { id: 'image', title: 'Add Image', onClick: handlers.openImageMenu },
      { id: 'link', title: 'Add Link', onClick: handlers.setLink },
    ]
  ), [handlers])

  const calculateVisible = useMemo(() => {
    return () => {
      const leftContainer = leftToolbarRef.current
      if (!leftContainer) {
        setVisibleButtons(toolbarButtons.map(b => b.id))
        return
      }
      
      const containerWidth = leftContainer.offsetWidth || 0
      if (containerWidth === 0) {
        setVisibleButtons(toolbarButtons.map(b => b.id))
        return
      }
      
      // Measure overflow button width (always visible)
      const overflowButton = leftContainer.querySelector('[title="More tools"]') as HTMLElement
      const overflowButtonWidth = overflowButton?.offsetWidth || 32
      
      // Button width and gap
      const buttonWidth = 32
      const gap = 4 // gap-1 = 4px
      
      // Calculate available space for toolbar buttons (reserve space for overflow button)
      const available = Math.max(0, containerWidth - overflowButtonWidth - gap)
      
      let used = 0
      const visible: string[] = []
      for (const btn of toolbarButtons) {
        const needed = buttonWidth + (visible.length > 0 ? gap : 0)
        if (used + needed <= available) {
          visible.push(btn.id)
          used += needed
        } else {
          break
        }
      }
      
      // Always show at least a few buttons if space is very limited
      if (visible.length === 0 && available > 0) {
        setVisibleButtons(toolbarButtons.slice(0, Math.min(3, toolbarButtons.length)).map(b => b.id))
      } else {
        setVisibleButtons(visible)
      }
    }
  }, [toolbarButtons])

  useEffect(() => {
    // Initial and on resize
    const fn = calculateVisible
    const t = setTimeout(fn, 50)
    const RO = (typeof window !== 'undefined' ? (window as any).ResizeObserver : undefined)
    const ro = RO ? new RO(() => setTimeout(fn, 50)) : null
    if (ro && toolbarRef.current) ro.observe(toolbarRef.current)
    const onResize = () => setTimeout(fn, 50)
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', onResize)
      if (ro) ro.disconnect()
    }
  }, [calculateVisible])

  // Register the editor with the AI context and DOCX handler
  useEffect(() => {
    if (editor) {
      setEditor(editor);
      registerAICommands();
      // Register for DOCX AI operations
      registerTiptapEditor(editor);
    }
    
    return () => {
      if (editor) {
        unregisterTiptapEditor(editor);
      }
      setEditor(null);
    };
  }, [editor, setEditor, registerAICommands]);

  // Listen for AI responses and apply them
  useEffect(() => {
    const handleAIResponse = (event: CustomEvent) => {
      const { response, actionType, selection: responseSelection } = event.detail;
      
      if (!editor || !response) return;
      
      switch (actionType) {
        case 'rewrite':
        case 'correct':
        case 'expand':
        case 'translate':
          if (responseSelection) {
            const { from, to, text: originalText } = responseSelection;
            const currentSlice = editor.state.doc.textBetween(from, to);

            if (currentSlice.trim() === (originalText || '').trim()) {
              editor.chain().focus()
                .deleteRange({ from, to })
                .insertContent(response)
                .run();
            } else {
              const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const html = editor.getHTML();
              let updated = html;
              if (originalText && originalText.trim().length > 0) {
                const words = originalText.trim().split(/\s+/).map(escapeRegExp);
                const flexible = new RegExp(words.join('(?:\\s*(?:<[^>]+>\\s*)*)'), 'i');
                updated = html.replace(flexible, response);
              } else {
                updated = html;
              }
              if (updated !== html) {
                editor.commands.setContent(updated, { emitUpdate: true });
              } else {
                editor.chain().focus().insertContent(response).run();
              }
            }
          } else {
            editor.chain().focus().insertContent(response).run();
          }
          break;
        case 'summarize':
        case 'outline':
          editor.chain().focus().insertContent(`\n\n${response}`).run();
          break;
        default:
          editor.chain().focus().insertContent(response).run();
      }
    };

    window.addEventListener('tiptap-ai-response', handleAIResponse as EventListener);
    
    return () => {
      window.removeEventListener('tiptap-ai-response', handleAIResponse as EventListener);
    };
  }, [editor]);

  // no-op

  if (!editor) {
    return null;
  }


  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    const target = event.target as HTMLElement
    const isTable = target.closest('table') !== null
    
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      isTable,
    })
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  const handleTableAction = (action: () => void) => {
    action()
    closeContextMenu()
  }

  // Adjust context menu position if it goes off-screen
  const getAdjustedPosition = (x: number, y: number) => {
    const menuWidth = 200
    const menuHeight = 300
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    let adjustedX = x
    let adjustedY = y

    if (x + menuWidth > windowWidth) {
      adjustedX = x - menuWidth
    }

    if (y + menuHeight > windowHeight) {
      adjustedY = y - menuHeight
    }

    return { x: adjustedX, y: adjustedY }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className={cn(styles['simple-tiptap-container'], className)}>
      {/* Toolbar */}
      <div ref={toolbarRef} className="flex bg-card items-center px-3 py-2 gap-1 border-b">
        {/* Left side toolbar items */}
        <div ref={leftToolbarRef} className="flex items-center gap-1 flex-1 min-w-0">
          {/* Responsive icon buttons */}
          <div className="flex items-center">
            {visibleButtons.includes('undo') && (
              <UndoButton editor={editor} onClick={handlers.undo} />
            )}
            {visibleButtons.includes('redo') && (
              <RedoButton editor={editor} onClick={handlers.redo} />
            )}
            {visibleButtons.includes('redo') && (
              <div className="w-px h-6 bg-border mx-1" />
            )}
            {visibleButtons.includes('bold') && (
              <BoldButton editor={editor} onClick={handlers.toggleBold} />
            )}
            {visibleButtons.includes('italic') && (
              <ItalicButton editor={editor} onClick={handlers.toggleItalic} />
            )}
            {visibleButtons.includes('underline') && (
              <UnderlineButton editor={editor} onClick={handlers.toggleUnderline} />
            )}
            {visibleButtons.includes('strike') && (
              <StrikethroughButton editor={editor} onClick={handlers.toggleStrike} />
            )}
            {visibleButtons.includes('code') && (
              <CodeButton editor={editor} onClick={handlers.toggleCode} />
            )}
            {visibleButtons.includes('code') && (
              <div className="w-px h-6 bg-border mx-1" />
            )}
            {visibleButtons.includes('highlight') && (
              <HighlightButton editor={editor} onClick={handlers.toggleHighlight} />
            )}
            {visibleButtons.includes('subscript') && (
              <SubscriptButton editor={editor} onClick={handlers.toggleSubscript} />
            )}
            {visibleButtons.includes('superscript') && (
              <SuperscriptButton editor={editor} onClick={handlers.toggleSuperscript} />
            )}
            {visibleButtons.includes('bullet') && (
              <BulletListButton editor={editor} onClick={handlers.toggleBulletList} />
            )}
            {visibleButtons.includes('ordered') && (
              <OrderedListButton editor={editor} onClick={handlers.toggleOrderedList} />
            )}
            {visibleButtons.includes('quote') && (
              <QuoteButton editor={editor} onClick={handlers.toggleBlockquote} />
            )}
            {visibleButtons.includes('quote') && (
              <div className="w-px h-6 bg-border mx-1" />
            )}
            {visibleButtons.includes('table') && (
              <TableButton editor={editor} onClick={handlers.insertTable} />
            )}
            {visibleButtons.includes('image') && (
              <ImageButton editor={editor} isOpen={isImageMenuOpen} onOpenChange={setIsImageMenuOpen} />
            )}
            {visibleButtons.includes('link') && (
              <LinkButton editor={editor} onClick={handlers.setLink} />
            )}
          </div>

          {/* Overflow menu - always visible */}
          <OverflowButton
            editor={editor}
            visibleButtons={visibleButtons}
            handlers={handlers}
            overflowOpen={overflowOpen}
            setOverflowOpen={setOverflowOpen}
            selectedFont={selectedFont}
            setSelectedFont={setSelectedFont}
          />
        </div>

        {/* Right side - Document Actions */}
        <div ref={rightActionsRef}>
          <DocumentActionButtons
            onShare={onShare}
            onSave={onSave}
            onDownload={onDownload}
            saving={saving}
            canSave={canSave}
          />
        </div>
      </div>

      <EditorContent 
        editor={editor} 
        className={styles['simple-tiptap-content']}
        onContextMenu={handleContextMenu}
      />

      {/* Table Context Menu */}
      {contextMenu.isOpen && contextMenu.isTable && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]"
          style={{
            left: getAdjustedPosition(contextMenu.x, contextMenu.y).x,
            top: getAdjustedPosition(contextMenu.x, contextMenu.y).y,
          }}
        >
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
            💡 Drag column borders to resize
          </div>
          <div className="py-1">
            <button
              onClick={() => handleTableAction(() => editor.chain().focus().addColumnBefore().run())}
              disabled={!editor.can().addColumnBefore()}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Column Before
            </button>
            <button
              onClick={() => handleTableAction(() => editor.chain().focus().addColumnAfter().run())}
              disabled={!editor.can().addColumnAfter()}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Column After
            </button>
            <button
              onClick={() => handleTableAction(() => editor.chain().focus().deleteColumn().run())}
              disabled={!editor.can().deleteColumn()}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Column
            </button>
          </div>
          
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => handleTableAction(() => editor.chain().focus().addRowBefore().run())}
              disabled={!editor.can().addRowBefore()}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Row Before
            </button>
            <button
              onClick={() => handleTableAction(() => editor.chain().focus().addRowAfter().run())}
              disabled={!editor.can().addRowAfter()}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Row After
            </button>
            <button
              onClick={() => handleTableAction(() => editor.chain().focus().deleteRow().run())}
              disabled={!editor.can().deleteRow()}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Row
            </button>
          </div>
          
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => handleTableAction(() => editor.chain().focus().deleteTable().run())}
              disabled={!editor.can().deleteTable()}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Table
            </button>
          </div>
        </div>
      )}


    </div>
  );
};
