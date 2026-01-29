import { Editor } from '@tiptap/react'
import { Table as TableIcon } from 'lucide-react'
import { Button } from '../../../ui/button'

interface TableButtonProps {
  editor: Editor
  onClick: () => void
}

export function TableButton({ editor, onClick }: TableButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Insert Table"
    >
      <TableIcon size={16} />
    </Button>
  )
}
