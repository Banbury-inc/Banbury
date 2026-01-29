import React, { useState } from 'react'
import { WrapText, Check } from 'lucide-react'
import { Button } from '../../../../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../ui/dropdown-menu'

type WrapOption = 'overflow' | 'wrap' | 'clip'

const wrapOptions: Array<{ value: WrapOption; label: string }> = [
  { value: 'overflow', label: 'Overflow' },
  { value: 'wrap', label: 'Wrap' },
  { value: 'clip', label: 'Clip' },
]

interface WrapButtonProps {
  applyCellStyle: (property: string, value: any) => void
  removeCellStyle: (property: string) => void
}

export function WrapButton({ applyCellStyle, removeCellStyle }: WrapButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedWrapOption, setSelectedWrapOption] = useState<WrapOption>('overflow')

  const resetWrapStyles = () => {
    const wrapStyleProperties: Array<'whiteSpace' | 'overflow' | 'textOverflow' | 'wordBreak' | 'overflowWrap'> = [
      'whiteSpace',
      'overflow',
      'textOverflow',
      'wordBreak',
      'overflowWrap'
    ]
    wrapStyleProperties.forEach(property => {
      try {
        removeCellStyle(property)
      } catch (error) {
        console.error('Error clearing wrap style property:', property, error)
      }
    })
  }

  const handleWrapSelect = (option: WrapOption) => {
    setSelectedWrapOption(option)
    setIsOpen(false)

    try {
      resetWrapStyles()

      if (option === 'overflow') {
        applyCellStyle('whiteSpace', 'nowrap')
        applyCellStyle('overflow', 'visible')
        applyCellStyle('textOverflow', 'clip')
        applyCellStyle('wordBreak', 'normal')
        applyCellStyle('overflowWrap', 'normal')
        return
      }

      if (option === 'wrap') {
        applyCellStyle('whiteSpace', 'normal')
        applyCellStyle('wordBreak', 'break-word')
        applyCellStyle('overflow', 'hidden')
        applyCellStyle('textOverflow', 'clip')
        applyCellStyle('overflowWrap', 'anywhere')
        return
      }

      applyCellStyle('whiteSpace', 'nowrap')
      applyCellStyle('overflow', 'hidden')
      applyCellStyle('textOverflow', 'clip')
    } catch (error) {
      console.error('Error applying wrap option:', option, error)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="icon-xs"
          title="Text Wrapping"
        >
          <WrapText size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {wrapOptions.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleWrapSelect(option.value)}
          >
            <div className="flex items-center justify-between w-full">
              <span>{option.label}</span>
              {selectedWrapOption === option.value && <Check size={16} />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
