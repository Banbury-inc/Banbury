import React from 'react'
import { Redo } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'

interface RedoButtonProps {
  onClick: () => void
}

export function RedoButton({ onClick }: RedoButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Redo (Ctrl+Y)"
    >
      <Redo size={16} />
    </Button>
  )
}
