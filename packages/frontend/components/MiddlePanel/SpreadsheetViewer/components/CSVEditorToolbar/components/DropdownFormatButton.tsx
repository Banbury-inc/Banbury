import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface DropdownFormatButtonProps {
  onClick: () => void
}

export function DropdownFormatButton({ onClick }: DropdownFormatButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Dropdown Format"
    >
      <ChevronDown size={16} />
    </Button>
  )
}
