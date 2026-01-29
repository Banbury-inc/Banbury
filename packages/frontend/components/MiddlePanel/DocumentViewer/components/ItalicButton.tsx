import { Editor } from '@tiptap/react'
import { Italic } from 'lucide-react'
import { Button } from '../../../ui/button'

interface ItalicButtonProps {
  editor: Editor
  onClick: () => void
}

export function ItalicButton({ editor, onClick }: ItalicButtonProps) {
  return (
    <Button
      variant={editor.isActive('italic') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Italic"
    >
      <Italic size={16} />
    </Button>
  )
}
