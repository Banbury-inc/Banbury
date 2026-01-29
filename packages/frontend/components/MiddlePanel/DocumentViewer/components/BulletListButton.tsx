import { Editor } from '@tiptap/react'
import { List } from 'lucide-react'
import { Button } from '../../../ui/button'

interface BulletListButtonProps {
  editor: Editor
  onClick: () => void
}

export function BulletListButton({ editor, onClick }: BulletListButtonProps) {
  return (
    <Button
      variant={editor.isActive('bulletList') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Bullet List"
    >
      <List size={16} />
    </Button>
  )
}
