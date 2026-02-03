import React from 'react'
import { Type } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'

interface TextFormatButtonProps {
  onClick: () => void
}

export function TextFormatButton({ onClick }: TextFormatButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Text Format"
    >
      <Type size={16} />
    </Button>
  )
}
