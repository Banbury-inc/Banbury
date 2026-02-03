import { Editor } from '@tiptap/react'
import { Undo } from 'lucide-react'
import { Button } from '../../../common/ui/button'

interface UndoButtonProps {
  editor: Editor
  onClick: () => void
}

export function UndoButton({ editor, onClick }: UndoButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Undo"
      disabled={!editor.can().undo()}
    >
      <Undo width={16} height={16} />
    </Button>
  )
}
