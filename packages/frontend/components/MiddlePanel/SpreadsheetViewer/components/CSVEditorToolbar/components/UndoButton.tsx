import React from 'react'
import { Undo } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface UndoButtonProps {
  onClick: () => void
}

export function UndoButton({ onClick }: UndoButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Undo (Ctrl+Z)"
    >
      <Undo size={16} />
    </Button>
  )
}
