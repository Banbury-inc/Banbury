import { Editor } from '@tiptap/react'
import { Highlighter } from 'lucide-react'
import { Button } from '../../../common/ui/button'

interface HighlightButtonProps {
  editor: Editor
  onClick: () => void
}

export function HighlightButton({ editor, onClick }: HighlightButtonProps) {
  return (
    <Button
      variant={editor.isActive('highlight') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Highlight"
    >
      <Highlighter size={16} />
    </Button>
  )
}
