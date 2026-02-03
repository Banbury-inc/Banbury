import React, { useState } from 'react'
import { AlignLeft, AlignCenter, AlignRight, ChevronDown } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../common/ui/dropdown-menu'

interface AlignmentButtonProps {
  handleAlignLeft: () => void
  handleAlignCenter: () => void
  handleAlignRight: () => void
}

export function AlignmentButton({ handleAlignLeft, handleAlignCenter, handleAlignRight }: AlignmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleAlignmentSelect = (alignment: 'left' | 'center' | 'right') => {
    switch (alignment) {
      case 'left':
        handleAlignLeft()
        break
      case 'center':
        handleAlignCenter()
        break
      case 'right':
        handleAlignRight()
        break
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="icon-xs"
          title="Text Alignment"
          className="flex items-center justify-center gap-0.5 min-w-[32px] px-1"
        >
          <AlignLeft size={16} className="shrink-0" />
          <ChevronDown size={12} className="shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[120px]">
        <DropdownMenuItem onClick={() => handleAlignmentSelect('left')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlignLeft size={16} />
            Align Left
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAlignmentSelect('center')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlignCenter size={16} />
            Align Center
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAlignmentSelect('right')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlignRight size={16} />
            Align Right
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
