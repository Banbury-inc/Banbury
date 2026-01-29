import React from 'react'
import { Underline } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface UnderlineButtonProps {
  onClick: () => void
}

export function UnderlineButton({ onClick }: UnderlineButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Underline (Ctrl+U)"
    >
      <Underline size={16} />
    </Button>
  )
}
