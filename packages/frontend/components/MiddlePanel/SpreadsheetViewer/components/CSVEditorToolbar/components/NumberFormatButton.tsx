import React from 'react'
import { Hash } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface NumberFormatButtonProps {
  onClick: () => void
}

export function NumberFormatButton({ onClick }: NumberFormatButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Number Format"
    >
      <Hash size={16} />
    </Button>
  )
}
