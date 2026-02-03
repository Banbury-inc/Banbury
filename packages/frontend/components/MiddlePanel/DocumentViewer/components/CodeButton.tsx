import { Editor } from '@tiptap/react'
import { Code } from 'lucide-react'
import { Button } from '../../../common/ui/button'

interface CodeButtonProps {
  editor: Editor
  onClick: () => void
}

export function CodeButton({ editor, onClick }: CodeButtonProps) {
  return (
    <Button
      variant={editor.isActive('code') ? 'default' : 'primary'}
      size="icon-xs"
      onClick={onClick}
      title="Code"
    >
      <Code size={16} />
    </Button>
  )
}
