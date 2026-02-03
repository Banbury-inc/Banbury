import { Editor } from '@tiptap/react'
import { Bold } from 'lucide-react'
import { Button } from '../../../common/ui/button'

interface BoldButtonProps {
  editor: Editor
  onClick: () => void
}

export function BoldButton({ editor, onClick }: BoldButtonProps) {
  return (
    <Button
      variant={editor.isActive('bold') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Bold"
    >
      <Bold size={16} />
    </Button>
  )
}
