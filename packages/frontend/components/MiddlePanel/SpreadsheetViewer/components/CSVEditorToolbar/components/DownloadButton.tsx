import React from 'react'
import { Download } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'

interface DownloadButtonProps {
  onClick: () => void
}

export function DownloadButton({ onClick }: DownloadButtonProps) {
  return (
    <Button
      variant="primary"
      size="icon-xs"
      onClick={onClick}
      title="Download spreadsheet"
    >
      <Download size={16} />
    </Button>
  )
}
