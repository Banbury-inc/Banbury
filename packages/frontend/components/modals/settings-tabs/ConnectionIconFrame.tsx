import type { ReactNode } from 'react'

import { cn } from '../../../utils'

interface ConnectionIconFrameProps {
  children: ReactNode
  isActive: boolean
}

export function ConnectionIconFrame({ children, isActive }: ConnectionIconFrameProps) {
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted transition-colors',
        !isActive && 'text-muted-foreground'
      )}
    >
      <div className={cn('flex items-center justify-center', !isActive && 'opacity-60')}>
        {children}
      </div>
    </div>
  )
}
