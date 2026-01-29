import React from 'react'
import { Filter } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface FiltersButtonProps {
  onClick: () => void
}

export function FiltersButton({ onClick }: FiltersButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Toggle Filters (Ctrl+K)"
    >
      <Filter size={16} />
    </Button>
  )
}
