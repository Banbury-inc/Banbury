import React from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '../../../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../common/ui/dropdown-menu'

interface OverflowButtonProps {
  buttonOrder: string[]
  visibleButtons: string[]
  overflowButtonDefs: Record<string, { icon: React.ReactNode; title: string; handler: (e?: React.MouseEvent<HTMLElement>) => void }>
  overflowOpen: boolean
  setOverflowOpen: (open: boolean) => void
}

export function OverflowButton({
  buttonOrder,
  visibleButtons,
  overflowButtonDefs,
  overflowOpen,
  setOverflowOpen,
}: OverflowButtonProps) {
  const hiddenButtons = buttonOrder.filter(buttonId => !visibleButtons.includes(buttonId))

  if (hiddenButtons.length === 0) {
    return null
  }

  return (
    <DropdownMenu open={overflowOpen} onOpenChange={setOverflowOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" title="More tools">
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {hiddenButtons.map((buttonId) => {
          const buttonDef = overflowButtonDefs[buttonId]
          if (!buttonDef) return null
          
          return (
            <DropdownMenuItem
              key={buttonId}
              onClick={() => {
                setOverflowOpen(false)
                buttonDef.handler()
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {buttonDef.icon}
                {buttonDef.title}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
