import React from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'

interface DateFormatButtonProps {
  onClick: () => void
}

export function DateFormatButton({ onClick }: DateFormatButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Date Format"
    >
      <Calendar size={16} />
    </Button>
  )
}
