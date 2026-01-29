import React from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface ShareButtonProps {
  onClick: () => void
}

export function ShareButton({ onClick }: ShareButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Share spreadsheet"
    >
      <Share2 size={16} />
    </Button>
  )
}
