import { Editor } from '@tiptap/react'
import { ListOrdered } from 'lucide-react'
import { Button } from '../../../common/ui/button'

interface OrderedListButtonProps {
  editor: Editor
  onClick: () => void
}

export function OrderedListButton({ editor, onClick }: OrderedListButtonProps) {
  return (
    <Button
      variant={editor.isActive('orderedList') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Numbered List"
    >
      <ListOrdered size={16} />
    </Button>
  )
}
