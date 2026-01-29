import React from 'react'
import { Percent } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface PercentageFormatButtonProps {
  onClick: () => void
}

export function PercentageFormatButton({ onClick }: PercentageFormatButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Percentage Format"
    >
      <Percent size={16} />
    </Button>
  )
}
