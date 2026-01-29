import { Editor } from '@tiptap/react'
import { Link as LinkIcon } from 'lucide-react'
import { Button } from '../../../ui/button'

interface LinkButtonProps {
  editor: Editor
  onClick: () => void
}

export function LinkButton({ editor, onClick }: LinkButtonProps) {
  return (
    <Button
      variant={editor.isActive('link') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Add Link"
    >
      <LinkIcon size={16} />
    </Button>
  )
}
