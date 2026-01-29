import { Editor } from '@tiptap/react'
import { Superscript as SuperscriptIcon } from 'lucide-react'
import { Button } from '../../../ui/button'

interface SuperscriptButtonProps {
  editor: Editor
  onClick: () => void
}

export function SuperscriptButton({ editor, onClick }: SuperscriptButtonProps) {
  return (
    <Button
      variant={editor.isActive('superscript') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Superscript"
    >
      <SuperscriptIcon size={16} />
    </Button>
  )
}
