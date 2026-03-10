'use client';

import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
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
  Link as LinkIcon,
  Image as ImageIcon,
  MoreHorizontal,
} from 'lucide-react';
import styles from '../../../styles/SimpleTiptapEditor.module.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../common/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../common/ui/popover';

interface EmailTiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onInsertSignature?: () => void;
  signature?: string;
  loadingSignature?: boolean;
}

export const EmailTiptapEditor: React.FC<EmailTiptapEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your message here...',
  className = '',
  disabled = false,
  onInsertSignature,
  signature,
  loadingSignature = false
}) => {
  const [isClient, setIsClient] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkPopoverOpen, setLinkPopoverOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [imagePopoverOpen, setImagePopoverOpen] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      HorizontalRule,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: styles['simple-tiptap-editor'],
        'aria-label': placeholder,
      },
    },
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  const handleInsertLink = () => {
    if (!editor || !linkUrl.trim()) return
    const url = linkUrl.trim()
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setLinkUrl('')
    setLinkPopoverOpen(false)
  }

  const handleInsertImage = () => {
    if (!editor || !imageUrl.trim()) return
    editor.chain().focus().setImage({ src: imageUrl.trim() }).run()
    setImageUrl('')
    setImagePopoverOpen(false)
  }

  if (!editor) return null;

  if (!isClient) {
    return (
      <div className={`${className}`}>
        <div className={styles['simple-tiptap-content']}>
          <div className={styles['simple-tiptap-editor']}>
            {placeholder}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles['simple-tiptap-container']} ${className}`}>
      {/* Toolbar */}
      <div className={styles['simple-tiptap-toolbar']}>
        <div className="flex items-center gap-1 flex-1">
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

          {/* Link popover */}
          <div className={styles['toolbar-group']}>
            <Popover open={linkPopoverOpen} onOpenChange={(open) => {
              setLinkPopoverOpen(open)
              if (open) {
                const existing = editor.getAttributes('link').href || ''
                setLinkUrl(existing)
              }
            }}>
              <PopoverTrigger asChild>
                <button
                  className={`${styles['toolbar-button']} ${editor.isActive('link') ? styles['active'] : ''}`}
                  title="Link"
                >
                  <LinkIcon size={16} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <p className="text-xs font-medium text-muted-foreground mb-2">Insert link</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleInsertLink() }
                      if (e.key === 'Escape') { setLinkPopoverOpen(false) }
                    }}
                    placeholder="https://..."
                    className="flex-1 text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    autoFocus
                  />
                  <button
                    onClick={handleInsertLink}
                    className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Insert
                  </button>
                </div>
                {editor.isActive('link') && (
                  <button
                    onClick={() => {
                      editor.chain().focus().extendMarkRange('link').unsetLink().run()
                      setLinkPopoverOpen(false)
                    }}
                    className="mt-2 text-xs text-destructive hover:underline"
                  >
                    Remove link
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Image popover */}
          <div className={styles['toolbar-group']}>
            <Popover open={imagePopoverOpen} onOpenChange={(open) => {
              setImagePopoverOpen(open)
              if (!open) setImageUrl('')
            }}>
              <PopoverTrigger asChild>
                <button
                  className={styles['toolbar-button']}
                  title="Insert Image"
                >
                  <ImageIcon size={16} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <p className="text-xs font-medium text-muted-foreground mb-2">Insert image</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleInsertImage() }
                      if (e.key === 'Escape') { setImagePopoverOpen(false) }
                    }}
                    placeholder="https://..."
                    className="flex-1 text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    autoFocus
                  />
                  <button
                    onClick={handleInsertImage}
                    className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Insert
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* More Tools */}
          <div className={styles['toolbar-group']}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={styles['toolbar-button']} title="More Tools">
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
      </div>

      <EditorContent
        editor={editor}
        className={styles['simple-tiptap-content']}
      />
    </div>
  );
};
