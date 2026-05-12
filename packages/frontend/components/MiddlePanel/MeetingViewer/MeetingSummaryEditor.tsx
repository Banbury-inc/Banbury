import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TaskList } from '@tiptap/extension-list'
import { TaskItem } from '@tiptap/extension-list'
import styles from '../../../styles/scrollbar.module.css'
import { cn } from '../../../utils'

interface MeetingSummaryEditorProps {
  initialContent?: string
  onContentChange?: (content: string) => void
  placeholder?: string
  isReadOnly?: boolean
  isLoading?: boolean
}

export interface MeetingSummaryEditorRef {
  editor: Editor | null
  appendHtml: (html: string) => void
  setHtml: (html: string) => void
}

export const MeetingSummaryEditor = forwardRef<MeetingSummaryEditorRef, MeetingSummaryEditorProps>(({
  initialContent = '',
  onContentChange,
  placeholder = 'Summary will appear here...',
  isReadOnly = false,
  isLoading = false
}, ref) => {
  const isInternalUpdate = useRef(false)
  const lastContentRef = useRef<string>('')
  
  // Helper to format content for editor
  const formatContentForEditor = (content: string | undefined | null): string => {
    if (!content || content.trim() === '') {
      return ''
    }
    const trimmed = String(content).trim()
    // Check if it's HTML (contains HTML tags)
    const isHtml = /<[a-z][\s\S]*>/i.test(trimmed)
    if (isHtml) {
      // Remove empty paragraphs and whitespace-only content
      const cleaned = trimmed.replace(/<p>\s*<\/p>/gi, '').replace(/<p>(\s|&nbsp;)+<\/p>/gi, '')
      return cleaned || ''
    }
    return `<p>${trimmed}</p>`
  }
  
  // Check if content is actually empty (after formatting)
  const hasContent = (content: string | undefined | null): boolean => {
    if (!content) return false
    const formatted = formatContentForEditor(content)
    if (!formatted) return false
    // Remove HTML tags and check if there's actual text content
    const textContent = formatted.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
    return textContent.length > 0
  }
  
  const editor = useEditor({
    immediatelyRender: false,
    editable: !isReadOnly,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
      }),
    ],
    content: formatContentForEditor(initialContent),
    onUpdate: ({ editor }) => {
      if (isInternalUpdate.current || isReadOnly) return
      
      const html = editor.getHTML()
      onContentChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'meeting-summary-editor',
      },
    },
  })

  // Update editor content when initialContent changes
  useEffect(() => {
    if (!editor) return
    
    const contentString = String(initialContent || '')
    const formattedContent = formatContentForEditor(initialContent)
    const hasActualContent = hasContent(initialContent)
    
    // Get current editor content (normalized for comparison)
    const currentContent = editor.getHTML().trim()
    const formattedCurrent = formatContentForEditor(currentContent)
    const currentHasContent = hasContent(currentContent)
    
    // Only update if content actually changed
    if (lastContentRef.current !== contentString || formattedCurrent !== formattedContent || hasActualContent !== currentHasContent) {
      lastContentRef.current = contentString
      
      isInternalUpdate.current = true
      
      if (!hasActualContent || formattedContent === '') {
        editor.commands.clearContent(false)
      } else {
        // Ensure content is set properly so placeholder hides
        editor.commands.setContent(formattedContent, false)
      }
      
      isInternalUpdate.current = false
    }
  }, [editor, initialContent])
  
  // Also update when editor first becomes available with initial content
  useEffect(() => {
    if (editor && initialContent && lastContentRef.current === '') {
      const formattedContent = formatContentForEditor(initialContent)
      const hasActualContent = hasContent(initialContent)
      if (hasActualContent && formattedContent) {
        lastContentRef.current = String(initialContent)
        isInternalUpdate.current = true
        editor.commands.setContent(formattedContent, false)
        isInternalUpdate.current = false
      }
    }
  }, [editor, initialContent])

  // Expose editor and methods via ref
  useImperativeHandle(ref, () => ({
    editor,
    appendHtml: (html: string) => {
      if (editor && html) {
        isInternalUpdate.current = true
        // Insert at the end of the document
        const { from } = editor.state.selection
        editor.commands.insertContentAt(from, html, {
          updateSelection: false
        })
        isInternalUpdate.current = false
      }
    },
    setHtml: (html: string) => {
      if (editor && html) {
        isInternalUpdate.current = true
        editor.commands.setContent(html, false)
        isInternalUpdate.current = false
      }
    }
  }), [editor])

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className={cn("relative meeting-summary-wrapper h-full overflow-auto rounded-xl bg-transparent", styles.darkScrollbar)}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm">
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">Generating summary...</div>
        </div>
      )}
      <style>{`
        .meeting-summary-wrapper .ProseMirror {
          outline: none;
          padding: 1.5rem;
          min-height: 400px;
          color: var(--foreground);
          background: transparent;
        }
        
        .meeting-summary-wrapper .ProseMirror[contenteditable="false"] {
          cursor: default;
        }
        
        .meeting-summary-wrapper .ProseMirror h1 {
          font-size: 1.625rem;
          font-weight: 650;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.2;
          letter-spacing: -0.03em;
          color: var(--foreground);
        }
        
        .meeting-summary-wrapper .ProseMirror h1:first-child {
          margin-top: 0;
        }
        
        .meeting-summary-wrapper .ProseMirror h2 {
          font-size: 1.2rem;
          font-weight: 650;
          margin-top: 1.5rem;
          margin-bottom: 0.625rem;
          line-height: 1.3;
          letter-spacing: -0.02em;
          color: var(--foreground);
        }
        
        .meeting-summary-wrapper .ProseMirror h3 {
          font-size: 1rem;
          font-weight: 650;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
          color: var(--foreground);
        }
        
        .meeting-summary-wrapper .ProseMirror h4 {
          font-size: 0.95rem;
          font-weight: 600;
          margin-top: 0.875rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
          color: var(--foreground);
        }
        
        .meeting-summary-wrapper .ProseMirror p {
          margin: 0.85rem 0;
          font-size: 0.925rem;
          line-height: 1.7;
          color: var(--foreground);
        }
        
        .meeting-summary-wrapper .ProseMirror ul,
        .meeting-summary-wrapper .ProseMirror ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }
        
        .meeting-summary-wrapper .ProseMirror li {
          margin: 0.55rem 0;
          font-size: 0.925rem;
          line-height: 1.65;
          color: var(--foreground);
        }
        
        .meeting-summary-wrapper .ProseMirror ul {
          list-style-type: disc;
        }
        
        .meeting-summary-wrapper .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        
        .meeting-summary-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"] {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin: 0.5rem 0;
        }
        
        .meeting-summary-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"] > label {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin-right: 0.5rem;
          flex-shrink: 0;
        }
        
        .meeting-summary-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"] > label > input[type="checkbox"] {
          cursor: pointer;
          width: 1rem;
          height: 1rem;
        }
        
        .meeting-summary-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"] > div {
          flex: 1;
        }
        
        .meeting-summary-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"][data-checked="true"] {
          opacity: 0.7;
        }
        
        .meeting-summary-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"][data-checked="true"] > div {
          text-decoration: line-through;
          color: var(--muted-foreground);
        }
        
        .meeting-summary-wrapper .ProseMirror ol {
          list-style-type: decimal;
        }
        
        .meeting-summary-wrapper .ProseMirror strong {
          font-weight: 600;
          color: var(--foreground);
        }
        
        .meeting-summary-wrapper .ProseMirror em {
          font-style: italic;
        }
        
        .meeting-summary-wrapper .ProseMirror code {
          background: var(--muted);
          color: var(--foreground);
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono, 'SF Pro', monospace);
          font-size: 0.875em;
        }
        
        .meeting-summary-wrapper .ProseMirror pre {
          background: var(--muted);
          color: var(--foreground);
          padding: 1rem;
          border-radius: var(--radius-md);
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .meeting-summary-wrapper .ProseMirror pre code {
          background: none;
          padding: 0;
        }
        
        .meeting-summary-wrapper .ProseMirror blockquote {
          border-left: 3px solid var(--border);
          padding-left: 1rem;
          margin: 1rem 0;
          color: var(--muted-foreground);
          font-style: italic;
        }
        
        .meeting-summary-wrapper .ProseMirror .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--muted-foreground);
          pointer-events: none;
          height: 0;
        }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  )
})

MeetingSummaryEditor.displayName = 'MeetingSummaryEditor'
