import { Editor } from '@tiptap/react'
import { Redo } from 'lucide-react'
import { Button } from '../../../ui/button'

interface RedoButtonProps {
  editor: Editor
  onClick: () => void
}

export function RedoButton({ editor, onClick }: RedoButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Redo"
      disabled={!editor.can().redo()}
    >
      <Redo size={16} />
    </Button>
  )
}
