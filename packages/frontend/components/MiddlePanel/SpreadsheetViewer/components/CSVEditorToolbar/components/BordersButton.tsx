import React, { useState } from 'react'
import { Grid, X, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Minus } from 'lucide-react'
import { Button } from '../../../../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../../ui/dropdown-menu'

interface BordersButtonProps {
  applyBordersOption: (option: 'all' | 'outer' | 'inner' | 'top' | 'right' | 'bottom' | 'left' | 'thick-outer' | 'dashed-outer' | 'none') => void
  borderStyle: 'thin' | 'thick' | 'dashed'
  setBorderStyle: (style: 'thin' | 'thick' | 'dashed') => void
}

export function BordersButton({ applyBordersOption, borderStyle, setBorderStyle }: BordersButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="icon-xs"
          title="Borders"
        >
          <Grid size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[260px] p-1">
        <div 
          className="grid gap-1 p-1"
          style={{ gridTemplateColumns: 'repeat(5, 40px)' }}
        >
          <Button
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} 
            onClick={() => {
              setIsOpen(false)
              applyBordersOption('all')
            }} 
            title="All borders"
            className="h-8 w-8"
          >
            <Grid size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} 
            onClick={() => {
              setIsOpen(false)
              applyBordersOption('outer')
            }} 
            title="Outer borders"
            className="h-8 w-8"
          >
            <Grid size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} 
            onClick={() => {
              setIsOpen(false)
              applyBordersOption('inner')
            }} 
            title="Inner borders"
            className="h-8 w-8"
          >
            <Grid size={18} />
          </Button>
          <div />
          <Button
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} 
            onClick={() => {
              setIsOpen(false)
              applyBordersOption('none')
            }} 
            title="Clear borders"
            className="h-8 w-8"
          >
            <X size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} 
            onClick={() => {
              setIsOpen(false)
              applyBordersOption('top')
            }} 
            title="Top border"
            className="h-8 w-8"
          >
            <ArrowUp size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} 
            onClick={() => {
              setIsOpen(false)
              applyBordersOption('right')
            }} 
            title="Right border"
            className="h-8 w-8"
          >
            <ArrowRight size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} 
            onClick={() => {
              setIsOpen(false)
              applyBordersOption('bottom')
            }} 
            title="Bottom border"
            className="h-8 w-8"
          >
            <ArrowDown size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} 
            onClick={() => {
              setIsOpen(false)
              applyBordersOption('left')
            }} 
            title="Left border"
            className="h-8 w-8"
          >
            <ArrowLeft size={18} />
          </Button>
          <div />
        </div>
        <DropdownMenuSeparator className="my-1" />
        <div className="flex items-center px-1 gap-1">
          <span className="text-xs text-muted-foreground">Style</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setBorderStyle('thin')} 
            title="Thin"
            className="h-8 w-8"
          >
            <Minus size={18} style={{ borderBottom: '1px solid currentColor', width: 18 }} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setBorderStyle('thick')} 
            title="Thick"
            className="h-8 w-8"
          >
            <Minus size={18} style={{ borderBottom: '3px solid currentColor', width: 18 }} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setBorderStyle('dashed')} 
            title="Dashed"
            className="h-8 w-8"
          >
            <Minus size={18} style={{ borderBottom: '1px dashed currentColor', width: 18 }} />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
