import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Highlight } from '@tiptap/extension-highlight';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Image } from '@tiptap/extension-image';
import { TaskList } from '@tiptap/extension-list';
import { TaskItem } from '@tiptap/extension-list';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Type,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Wand2,
  MoreHorizontal
} from 'lucide-react';

import { useTiptapAIContext } from '../contexts/TiptapAIContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import { cn } from '../utils';

import styles from './SimpleTiptapEditor.module.css';

interface AITiptapEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const AITiptapEditor: React.FC<AITiptapEditorProps> = ({
  initialContent = '<p>Start typing...</p>',
  onContentChange,
  placeholder = 'Start typing...',
  className
}) => {
  const { setEditor, aiBridge, registerAICommands, aiCommands } = useTiptapAIContext();
  const [selection, setSelection] = useState<{ from: number; to: number; text: string } | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      HorizontalRule,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Image,
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
      if (onContentChange) {
        onContentChange(editor.getHTML());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      setSelection({ from, to, text });
    },
    editorProps: {
      attributes: {
        class: styles['simple-tiptap-editor'],
        'aria-label': placeholder,
      },
    },
  });

  // Register the editor with the AI context
  useEffect(() => {
    if (editor) {
      setEditor(editor);
      registerAICommands();
    }
    
    return () => {
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
            editor.chain().focus()
              .deleteRange({ from: responseSelection.from, to: responseSelection.to })
              .insertContent(response)
              .run();
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

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

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

  const hasSelection = selection?.text && selection.text.trim().length > 0;

  return (
    <div className={cn(styles['simple-tiptap-container'], className)}>
      {/* Toolbar */}
      <div className={styles['simple-tiptap-toolbar']}>
        {/* Undo/Redo */}
        <div className={styles['toolbar-group']}>
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className={styles['toolbar-button']}
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className={styles['toolbar-button']}
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>

        <div className={styles['toolbar-separator']} />

        {/* Text formatting */}
        <div className={styles['toolbar-group']}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('bold') ? styles['active'] : ''}`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('italic') ? styles['active'] : ''}`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('underline') ? styles['active'] : ''}`}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('strike') ? styles['active'] : ''}`}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('code') ? styles['active'] : ''}`}
            title="Code"
          >
            <Code size={16} />
          </button>
        </div>

        <div className={styles['toolbar-separator']} />

        {/* Alignment */}
        <div className={styles['toolbar-group']}>
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`${styles['toolbar-button']} ${editor.isActive({ textAlign: 'left' }) ? styles['active'] : ''}`}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`${styles['toolbar-button']} ${editor.isActive({ textAlign: 'center' }) ? styles['active'] : ''}`}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`${styles['toolbar-button']} ${editor.isActive({ textAlign: 'right' }) ? styles['active'] : ''}`}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`${styles['toolbar-button']} ${editor.isActive({ textAlign: 'justify' }) ? styles['active'] : ''}`}
            title="Justify"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        <div className={styles['toolbar-separator']} />

        {/* Lists and quotes */}
        <div className={styles['toolbar-group']}>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('bulletList') ? styles['active'] : ''}`}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('orderedList') ? styles['active'] : ''}`}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('blockquote') ? styles['active'] : ''}`}
            title="Quote"
          >
            <Quote size={16} />
          </button>
        </div>

        <div className={styles['toolbar-separator']} />

        {/* AI Features */}
        <div className={styles['toolbar-group']}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={styles['toolbar-button']} title="AI Tools">
                <Wand2 size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>AI Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Editing
              </DropdownMenuLabel>
              {aiCommands
                .filter(cmd => cmd.category === 'editing')
                .map(command => (
                  <DropdownMenuItem
                    key={command.id}
                    onClick={() => command.execute()}
                    disabled={command.id.includes('selection') && !hasSelection}
                  >
                    {command.name}
                  </DropdownMenuItem>
                ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Content
              </DropdownMenuLabel>
              {aiCommands
                .filter(cmd => cmd.category === 'content')
                .map(command => (
                  <DropdownMenuItem
                    key={command.id}
                    onClick={() => command.execute()}
                    disabled={command.id.includes('selection') && !hasSelection}
                  >
                    {command.name}
                  </DropdownMenuItem>
                ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Analysis
              </DropdownMenuLabel>
              {aiCommands
                .filter(cmd => cmd.category === 'analysis')
                .map(command => (
                  <DropdownMenuItem
                    key={command.id}
                    onClick={() => command.execute()}
                  >
                    {command.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={styles['toolbar-button']} title="More Tools">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={addImage}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={setLink}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Add Link
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                <Minus className="h-4 w-4 mr-2" />
                Horizontal Rule
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditorContent editor={editor} className={styles['simple-tiptap-content']} />
      
      {/* Status Bar */}
      {hasSelection && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/50">
          Selected: {selection?.text.length} characters
        </div>
      )}
    </div>
  );
};
