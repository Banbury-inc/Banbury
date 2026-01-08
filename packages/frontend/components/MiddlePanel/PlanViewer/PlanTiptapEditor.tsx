import React, { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TaskList } from '@tiptap/extension-list'
import { TaskItem } from '@tiptap/extension-list'
import styles from '../../../styles/scrollbar.module.css'
import { cn } from '../../../utils'

interface PlanTiptapEditorProps {
  initialContent: string
  onContentChange: (content: string) => void
  placeholder?: string
}

/**
 * Convert markdown to HTML for Tiptap
 */
function markdownToHtml(markdown: string): string {
  let html = markdown
  
  // Split into lines for processing
  const lines = html.split('\n')
  const processedLines: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    
    // Convert headings
    if (line.match(/^#### /)) {
      line = line.replace(/^#### (.+)$/, '<h4>$1</h4>')
    } else if (line.match(/^### /)) {
      line = line.replace(/^### (.+)$/, '<h3>$1</h3>')
    } else if (line.match(/^## /)) {
      line = line.replace(/^## (.+)$/, '<h2>$1</h2>')
    } else if (line.match(/^# /)) {
      line = line.replace(/^# (.+)$/, '<h1>$1</h1>')
    }
    // Convert task list items with id format: - [x] id:xxx | description
    else if (line.match(/^- \[(x| )\] (?:id:\S+\s*\|\s*)?/)) {
      const match = line.match(/^- \[(x| )\] (?:id:(\S+)\s*\|\s*)?(.+)$/)
      if (match) {
        const isChecked = match[1] === 'x'
        const id = match[2] || ''
        const content = match[3]
        const idAttr = id ? ` data-task-id="${id}"` : ''
        line = `<li data-type="taskItem" data-checked="${isChecked}"${idAttr}>${content}</li>`
      }
    }
    // Convert regular bullet list items
    else if (line.match(/^- /)) {
      line = line.replace(/^- (.+)$/, '<li>$1</li>')
    }
    // Convert bold and italic
    else {
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      line = line.replace(/\*(.+?)\*/g, '<em>$1</em>')
      line = line.replace(/`([^`]+)`/g, '<code>$1</code>')
    }
    
    // Convert paragraphs - any non-empty line that's not already a tag
    if (line.trim() && !line.match(/^<[^>]+>/)) {
      line = `<p>${line}</p>`
    }
    
    processedLines.push(line)
  }
  
  html = processedLines.join('\n')
  
  // Wrap consecutive task list items in ul tags
  html = html.replace(/(<li data-type="taskItem"[^>]*>.*?<\/li>\n?)+/gs, (match) => {
    return '<ul data-type="taskList">' + match + '</ul>'
  })
  
  // Wrap consecutive regular list items in ul tags
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => {
    if (!match.includes('data-type="taskItem"')) {
      return '<ul>' + match + '</ul>'
    }
    return match
  })
  
  // Convert code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
  
  // Clean up extra whitespace between tags
  html = html.replace(/>\s+</g, '><')
  
  return html
}

/**
 * Convert HTML from Tiptap back to markdown
 */
function htmlToMarkdown(html: string): string {
  let markdown = html
  
  // Convert headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
  
  // Convert task list items with id format
  markdown = markdown.replace(/<li[^>]*data-checked="true"[^>]*data-task-id="([^"]+)"[^>]*>(.*?)<\/li>/gi, '- [x] id:$1 | $2\n')
  markdown = markdown.replace(/<li[^>]*data-checked="false"[^>]*data-task-id="([^"]+)"[^>]*>(.*?)<\/li>/gi, '- [ ] id:$1 | $2\n')
  
  // Convert task list items without id
  markdown = markdown.replace(/<li[^>]*data-checked="true"[^>]*>(.*?)<\/li>/gi, '- [x] $1\n')
  markdown = markdown.replace(/<li[^>]*data-checked="false"[^>]*>(.*?)<\/li>/gi, '- [ ] $1\n')
  
  // Convert regular list items
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  
  // Remove ul/ol tags
  markdown = markdown.replace(/<\/?[uo]l[^>]*>/gi, '')
  
  // Convert bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  
  // Convert inline code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
  
  // Convert code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n')
  
  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
  
  // Clean up HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ')
  markdown = markdown.replace(/&amp;/g, '&')
  markdown = markdown.replace(/&lt;/g, '<')
  markdown = markdown.replace(/&gt;/g, '>')
  markdown = markdown.replace(/&quot;/g, '"')
  
  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '')
  
  // Clean up extra newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n')
  
  return markdown.trim()
}

export function PlanTiptapEditor({
  initialContent,
  onContentChange,
  placeholder = 'Start typing...'
}: PlanTiptapEditorProps) {
  const isInternalUpdate = useRef(false)
  
  const editor = useEditor({
    immediatelyRender: false,
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
      }),
    ],
    content: markdownToHtml(initialContent),
    onUpdate: ({ editor }) => {
      if (isInternalUpdate.current) return
      
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      onContentChange(markdown)
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  })

  // Update editor content when initialContent changes (e.g., when loading a different file)
  useEffect(() => {
    if (editor && initialContent) {
      const currentMarkdown = htmlToMarkdown(editor.getHTML())
      if (currentMarkdown !== initialContent) {
        isInternalUpdate.current = true
        const html = markdownToHtml(initialContent)
        editor.commands.setContent(html, false)
        isInternalUpdate.current = false
      }
    }
  }, [editor, initialContent])

  if (!editor) {
    return null
  }

  return (
    <div className={cn("plan-tiptap-wrapper h-full overflow-auto bg-card", styles.darkScrollbar)}>
      <style>{`
        .plan-tiptap-wrapper .ProseMirror {
          outline: none;
          padding: 1rem;
          min-height: 200px;
          color: hsl(var(--foreground));
          background: hsl(var(--card));
        }
        
        .plan-tiptap-wrapper .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.2;
          color: hsl(var(--foreground));
        }
        
        .plan-tiptap-wrapper .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.625rem;
          line-height: 1.3;
          color: hsl(var(--foreground));
        }
        
        .plan-tiptap-wrapper .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
          color: hsl(var(--foreground));
        }
        
        .plan-tiptap-wrapper .ProseMirror h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 0.875rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
          color: hsl(var(--foreground));
        }
        
        .plan-tiptap-wrapper .ProseMirror p {
          margin: 0.5rem 0;
          line-height: 1.6;
          color: hsl(var(--foreground));
        }
        
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
          margin: 0.5rem 0;
        }
        
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"],
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li.task-item {
          display: inline-flex;
          align-items: baseline;
          gap: 0.5rem;
          margin: 0.25rem 0;
          list-style: none;
          width: 100%;
        }
        
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"] > label,
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li.task-item > label {
          display: inline-flex;
          align-items: baseline;
          flex-shrink: 0;
        }
        
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"] > label > input[type="checkbox"],
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li.task-item > label > input[type="checkbox"] {
          cursor: pointer;
          flex-shrink: 0;
          margin: 0;
          margin-top: 0.25em;
        }
        
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"] > div,
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li.task-item > div {
          flex: 1;
          min-width: 0;
          display: inline-block;
        }
        
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"] > div > *,
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li.task-item > div > * {
          display: inline;
          margin: 0;
        }
        
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li[data-type="taskItem"] p,
        .plan-tiptap-wrapper .ProseMirror ul[data-type="taskList"] li.task-item p {
          display: inline !important;
          margin: 0 !important;
        }
        
        .plan-tiptap-wrapper .ProseMirror ul:not([data-type="taskList"]) {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        .plan-tiptap-wrapper .ProseMirror li {
          margin: 0.25rem 0;
          color: hsl(var(--foreground));
        }
        
        .plan-tiptap-wrapper .ProseMirror strong {
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        
        .plan-tiptap-wrapper .ProseMirror em {
          font-style: italic;
        }
        
        .plan-tiptap-wrapper .ProseMirror code {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
        
        .plan-tiptap-wrapper .ProseMirror pre {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .plan-tiptap-wrapper .ProseMirror pre code {
          background: none;
          padding: 0;
        }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  )
}
