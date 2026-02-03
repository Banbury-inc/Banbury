import { Editor } from '@tiptap/react'
import { Subscript as SubscriptIcon } from 'lucide-react'
import { Button } from '../../../common/ui/button'

interface SubscriptButtonProps {
  editor: Editor
  onClick: () => void
}

export function SubscriptButton({ editor, onClick }: SubscriptButtonProps) {
  return (
    <Button
      variant={editor.isActive('subscript') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Subscript"
    >
      <SubscriptIcon size={16} />
    </Button>
  )
}
