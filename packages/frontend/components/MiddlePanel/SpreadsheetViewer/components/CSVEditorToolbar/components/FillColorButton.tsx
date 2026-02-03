import React, { useState } from 'react'
import { PaintBucket } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../../common/ui/dropdown-menu'

interface FillColorButtonProps {
  applyCellStyle: (property: string, value: any) => void
  removeCellStyle: (property: string) => void
}

export function FillColorButton({ applyCellStyle, removeCellStyle }: FillColorButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const colors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5',
    '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#C0CA33',
    '#FDD835', '#FB8C00'
  ]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="icon-xs"
          title="Fill Color"
        >
          <PaintBucket size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px] p-1">
        <div 
          className="grid gap-1.5 p-1"
          style={{ gridTemplateColumns: 'repeat(10, 18px)' }}
          onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}
        >
          {colors.map((color) => (
            <div
              key={color}
              onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => { 
                e.preventDefault() 
                e.stopPropagation() 
              }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => { 
                e.preventDefault() 
                e.stopPropagation() 
                setIsOpen(false)
                requestAnimationFrame(() => applyCellStyle('backgroundColor', color)) 
              }}
              className="w-[18px] h-[18px] border border-border cursor-pointer hover:ring-2 hover:ring-ring"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()} 
          onClick={() => { 
            setIsOpen(false)
            setTimeout(() => removeCellStyle('backgroundColor'), 0) 
          }}
        >
          Clear fill color
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
