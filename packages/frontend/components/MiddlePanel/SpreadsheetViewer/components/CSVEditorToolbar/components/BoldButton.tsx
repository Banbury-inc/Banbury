import React from 'react'
import { Bold } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface BoldButtonProps {
  onClick: () => void
}

export function BoldButton({ onClick }: BoldButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Bold (Ctrl+B)"
    >
      <Bold size={16} />
    </Button>
  )
}
