import { Editor } from '@tiptap/react'
import { Strikethrough } from 'lucide-react'
import { Button } from '../../../common/ui/button'

interface StrikethroughButtonProps {
  editor: Editor
  onClick: () => void
}

export function StrikethroughButton({ editor, onClick }: StrikethroughButtonProps) {
  return (
    <Button
      variant={editor.isActive('strike') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Strikethrough"
    >
      <Strikethrough size={16} />
    </Button>
  )
}
