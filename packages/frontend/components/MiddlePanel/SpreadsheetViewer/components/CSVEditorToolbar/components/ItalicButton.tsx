import React from 'react'
import { Italic } from 'lucide-react'
import { Button } from '../../../../../ui/button'

interface ItalicButtonProps {
  onClick: () => void
}

export function ItalicButton({ onClick }: ItalicButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Italic (Ctrl+I)"
    >
      <Italic size={16} />
    </Button>
  )
}
