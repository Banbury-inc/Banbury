import { Level } from '@tiptap/extension-heading';
import { Highlight } from '@tiptap/extension-highlight';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Image } from '@tiptap/extension-image';
import { TaskList } from '@tiptap/extension-list';
import { TaskItem } from '@tiptap/extension-list';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { 
  Bold, 
  Italic, 
  Underline, 
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
  Link,
  Image as ImageIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon
} from 'lucide-react';
import React from 'react';

// Importing as module to satisfy Next.js CSS rules
import styles from './SimpleTiptapEditor.module.css';
import FileSearchPopover from './FileSearchPopover';
import { insertImageFromBackendFile } from './handlers/editorImage';
import { FileSystemItem } from '../utils/fileTreeUtils';

interface SimpleTiptapEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
}

export const SimpleTiptapEditor: React.FC<SimpleTiptapEditorProps> = ({
  initialContent = '<p>Start typing...</p>',
  onContentChange,
  placeholder = 'Start typing...'
}) => {
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
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      if (onContentChange) {
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

  if (!editor) {
    return null;
  }

  const handleFileSelect = (file: FileSystemItem) => {
    const fileId = (file.file_id || (file as any).file_id) as string | undefined
    const fileName = file.name
    if (fileId && fileName) insertImageFromBackendFile({ editor, fileId, fileName })
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

  return (
    <div className={styles['simple-tiptap-container'] + ' border-0'}>
      <div className={styles['simple-tiptap-toolbar'] + ' border-0'}>
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

        {/* Headings */}
        <div className={styles['toolbar-group']}>
          <select
            value={editor.getAttributes('heading').level || 'paragraph'}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(value) as Level }).run();
              }
            }}
            className={styles['toolbar-select']}
          >
            <option value="paragraph">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
          </select>
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
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            disabled={!editor.can().chain().focus().toggleHighlight().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('highlight') ? styles['active'] : ''}`}
            title="Highlight"
          >
            <Highlighter size={16} />
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
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('taskList') ? styles['active'] : ''}`}
            title="Task List"
          >
            <Type size={16} />
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

        {/* Special */}
        <div className={styles['toolbar-group']}>
          <button
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            disabled={!editor.can().chain().focus().toggleSuperscript().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('superscript') ? styles['active'] : ''}`}
            title="Superscript"
          >
            <SuperscriptIcon size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            disabled={!editor.can().chain().focus().toggleSubscript().run()}
            className={`${styles['toolbar-button']} ${editor.isActive('subscript') ? styles['active'] : ''}`}
            title="Subscript"
          >
            <SubscriptIcon size={16} />
          </button>
          <button
            onClick={setLink}
            className={`${styles['toolbar-button']} ${editor.isActive('link') ? styles['active'] : ''}`}
            title="Link"
          >
            <Link size={16} />
          </button>
          <FileSearchPopover onFileSelect={handleFileSelect}>
            <button
              className={styles['toolbar-button']}
              title="Add Image"
            >
              <ImageIcon size={16} />
            </button>
          </FileSearchPopover>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={styles['toolbar-button']}
            title="Horizontal Rule"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>

      <EditorContent editor={editor} className={styles['simple-tiptap-content']} />
    </div>
  );
};
