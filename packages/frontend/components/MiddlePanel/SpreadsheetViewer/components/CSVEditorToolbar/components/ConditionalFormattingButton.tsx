import React from 'react'
import { Ruler } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'

interface ConditionalFormattingButtonProps {
  onClick: () => void
}

export function ConditionalFormattingButton({ onClick }: ConditionalFormattingButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Conditional Formatting"
    >
      <Ruler size={16} />
    </Button>
  )
}
