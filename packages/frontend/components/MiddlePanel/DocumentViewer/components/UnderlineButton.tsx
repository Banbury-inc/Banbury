import { Editor } from '@tiptap/react'
import { Underline as UnderlineIcon } from 'lucide-react'
import { Button } from '../../../ui/button'

interface UnderlineButtonProps {
  editor: Editor
  onClick: () => void
}

export function UnderlineButton({ editor, onClick }: UnderlineButtonProps) {
  return (
    <Button
      variant={editor.isActive('underline') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Underline"
    >
      <UnderlineIcon size={16} />
    </Button>
  )
}
