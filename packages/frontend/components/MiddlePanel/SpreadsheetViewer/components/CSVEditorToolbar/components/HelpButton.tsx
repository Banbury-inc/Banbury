import React from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface HelpButtonProps {
  onClick: () => void
}

export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Keyboard shortcuts (F1)"
    >
      <HelpCircle size={16} />
    </Button>
  )
}
