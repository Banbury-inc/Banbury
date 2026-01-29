import { Editor } from '@tiptap/react'
import { Quote } from 'lucide-react'
import { Button } from '../../../ui/button'

interface QuoteButtonProps {
  editor: Editor
  onClick: () => void
}

export function QuoteButton({ editor, onClick }: QuoteButtonProps) {
  return (
    <Button
      variant={editor.isActive('blockquote') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Quote"
    >
      <Quote size={16} />
    </Button>
  )
}
