import React from 'react'
import { DollarSign } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface CurrencyFormatButtonProps {
  onClick: () => void
}

export function CurrencyFormatButton({ onClick }: CurrencyFormatButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Currency Format"
    >
      <DollarSign size={16} />
    </Button>
  )
}
