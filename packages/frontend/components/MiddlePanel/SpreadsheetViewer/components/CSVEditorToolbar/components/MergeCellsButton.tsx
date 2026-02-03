import React from 'react'
import { Grid } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'

interface MergeCellsButtonProps {
  onClick: () => void
}

export function MergeCellsButton({ onClick }: MergeCellsButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Merge Selected Cells"
    >
      <Grid size={16} />
    </Button>
  )
}
