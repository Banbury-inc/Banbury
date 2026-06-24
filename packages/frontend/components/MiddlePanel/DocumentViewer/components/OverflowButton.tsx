import { Editor } from '@tiptap/react'
import { Button } from '../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../../../common/ui/dropdown-menu'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
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
  MoreHorizontal,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
} from 'lucide-react'
import { ToolbarHandlers } from '../handlers/toolbarHandlers'

interface OverflowButtonProps {
  editor: Editor
  visibleButtons: string[]
  handlers: ToolbarHandlers
  overflowOpen: boolean
  setOverflowOpen: (open: boolean) => void
}

export function OverflowButton({
  editor,
  visibleButtons,
  handlers,
  overflowOpen,
  setOverflowOpen,
}: OverflowButtonProps) {
  return (
    <DropdownMenu open={overflowOpen} onOpenChange={setOverflowOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" title="More tools">
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {!visibleButtons.includes('undo') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.undo(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Undo width={16} height={16} />
              Undo
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('redo') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.redo(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Redo size={16} />
              Redo
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('bold') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleBold(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Bold size={16} />
              Bold
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('italic') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleItalic(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Italic size={16} />
              Italic
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('underline') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleUnderline(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <UnderlineIcon size={16} />
              Underline
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('strike') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleStrike(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Strikethrough size={16} />
              Strikethrough
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('code') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleCode(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Code size={16} />
              Code
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('highlight') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleHighlight(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Highlighter size={16} />
              Highlight
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('subscript') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleSubscript(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <SubscriptIcon size={16} />
              Subscript
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('superscript') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleSuperscript(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <SuperscriptIcon size={16} />
              Superscript
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('bullet') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleBulletList(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <List size={16} />
              Bullet List
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('ordered') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleOrderedList(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ListOrdered size={16} />
              Numbered List
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('quote') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.toggleBlockquote(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Quote size={16} />
              Quote
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('table') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.insertTable(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <TableIcon size={16} />
              Insert Table
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('image') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.openImageMenu(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={16} />
              Add Image
            </span>
          </DropdownMenuItem>
        )}
        {!visibleButtons.includes('link') && (
          <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.setLink(); }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <LinkIcon size={16} />
              Add Link
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {/* Headings Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Heading1 size={16} />
              Headings
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem 
              onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
            >
              H1
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
            >
              H2
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
            >
              H3
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => { editor.chain().focus().setParagraph().run(); }}
            >
              Paragraph
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* Text Alignment Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <AlignLeft size={16} />
              Text Alignment
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem 
              onClick={() => { handlers.alignLeft(); }}
              className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <AlignLeft size={16} />
                Align Left
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { handlers.alignCenter(); }}
              className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <AlignCenter size={16} />
                Align Center
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { handlers.alignRight(); }}
              className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <AlignRight size={16} />
                Align Right
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { handlers.alignJustify(); }}
              className={editor.isActive({ textAlign: 'justify' }) ? 'bg-accent' : ''}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <AlignJustify size={16} />
                Justify
              </span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { setOverflowOpen(false); handlers.insertHorizontalRule(); }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Minus size={16} />
            Horizontal Rule
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setOverflowOpen(false); editor.chain().focus().insertContent('™').run(); }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Type size={16} />
            Typography
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
