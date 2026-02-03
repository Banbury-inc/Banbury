import React from 'react'
import { BarChart3 } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'

interface ChartButtonProps {
  onClick: () => void
}

export function ChartButton({ onClick }: ChartButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Insert Chart"
    >
      <BarChart3 size={16} />
    </Button>
  )
}
