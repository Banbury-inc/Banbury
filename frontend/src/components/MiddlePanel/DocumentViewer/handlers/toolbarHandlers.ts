import { Editor } from '@tiptap/react'

interface CreateToolbarHandlersParams {
  editor: Editor | null
  setIsImageMenuOpen?: (open: boolean) => void
}

export interface ToolbarHandlers {
  undo: () => void
  redo: () => void
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  toggleStrike: () => void
  toggleCode: () => void
  toggleHighlight: () => void
  toggleSubscript: () => void
  toggleSuperscript: () => void
  alignLeft: () => void
  alignCenter: () => void
  alignRight: () => void
  alignJustify: () => void
  insertTable: () => void
  toggleBulletList: () => void
  toggleOrderedList: () => void
  toggleBlockquote: () => void
  insertHorizontalRule: () => void
  openImageMenu: () => void
  setLink: () => void
}

export function createToolbarHandlers({ editor, setIsImageMenuOpen }: CreateToolbarHandlersParams): ToolbarHandlers {
  const safe = (fn: () => void) => () => {
    try { fn(); } catch {}
  };

  return {
    undo: safe(() => { editor?.chain().focus().undo().run(); }),
    redo: safe(() => { editor?.chain().focus().redo().run(); }),
    toggleBold: safe(() => { editor?.chain().focus().toggleBold().run(); }),
    toggleItalic: safe(() => { editor?.chain().focus().toggleItalic().run(); }),
    toggleUnderline: safe(() => { editor?.chain().focus().toggleUnderline().run(); }),
    toggleStrike: safe(() => { editor?.chain().focus().toggleStrike().run(); }),
    toggleCode: safe(() => { editor?.chain().focus().toggleCode().run(); }),
    toggleHighlight: safe(() => { editor?.chain().focus().toggleHighlight().run(); }),
    toggleSubscript: safe(() => { editor?.chain().focus().toggleSubscript().run(); }),
    toggleSuperscript: safe(() => { editor?.chain().focus().toggleSuperscript().run(); }),
    alignLeft: safe(() => { editor?.chain().focus().setTextAlign('left').run(); }),
    alignCenter: safe(() => { editor?.chain().focus().setTextAlign('center').run(); }),
    alignRight: safe(() => { editor?.chain().focus().setTextAlign('right').run(); }),
    alignJustify: safe(() => { editor?.chain().focus().setTextAlign('justify').run(); }),
    insertTable: safe(() => { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }),
    toggleBulletList: safe(() => { editor?.chain().focus().toggleBulletList().run(); }),
    toggleOrderedList: safe(() => { editor?.chain().focus().toggleOrderedList().run(); }),
    toggleBlockquote: safe(() => { editor?.chain().focus().toggleBlockquote().run(); }),
    insertHorizontalRule: safe(() => { editor?.chain().focus().setHorizontalRule().run(); }),
    openImageMenu: safe(() => { setIsImageMenuOpen?.(true); }),
    setLink: safe(() => {
      const previousUrl = editor?.getAttributes('link').href as string | undefined;
      const url = window.prompt('URL', previousUrl || '');
      if (url == null) return;
      if (url === '') {
        editor?.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }),
  };
}


