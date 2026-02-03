import React from 'react'
import { Save } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'

interface SaveButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function SaveButton({ onClick, disabled }: SaveButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      disabled={disabled}
      title="Save spreadsheet (Ctrl+S)"
    >
      <Save size={16} />
    </Button>
  )
}
