import { Editor } from '@tiptap/react'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface TextAlignmentButtonProps {
  editor: Editor
  onAlignLeft: () => void
  onAlignCenter: () => void
  onAlignRight: () => void
  onAlignJustify: () => void
}

export function TextAlignmentButton({
  editor,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignJustify,
}: TextAlignmentButtonProps) {
  const getActiveIcon = () => {
    if (editor.isActive({ textAlign: 'left' })) return <AlignLeft size={16} />
    if (editor.isActive({ textAlign: 'center' })) return <AlignCenter size={16} />
    if (editor.isActive({ textAlign: 'right' })) return <AlignRight size={16} />
    if (editor.isActive({ textAlign: 'justify' })) return <AlignJustify size={16} />
    return <AlignLeft size={16} />
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" title="Text alignment">
            {getActiveIcon()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem 
            onClick={onAlignLeft}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
          >
            <span className="flex items-center gap-2">
              <AlignLeft size={16} />
              Align Left
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onAlignCenter}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
          >
            <span className="flex items-center gap-2">
              <AlignCenter size={16} />
              Align Center
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onAlignRight}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
          >
            <span className="flex items-center gap-2">
              <AlignRight size={16} />
              Align Right
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onAlignJustify}
            className={editor.isActive({ textAlign: 'justify' }) ? 'bg-accent' : ''}
          >
            <span className="flex items-center gap-2">
              <AlignJustify size={16} />
              Justify
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
