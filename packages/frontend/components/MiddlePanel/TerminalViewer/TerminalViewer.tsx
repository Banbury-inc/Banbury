import { RefreshCw, TerminalSquare } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { Button } from '../../common/ui/button'
import { Typography } from '../../common/ui/typography'
import { useWebTerminalSession } from './handlers/useWebTerminalSession'
import '@xterm/xterm/css/xterm.css'

interface TerminalViewerProps {
  cwd?: string
}

function getStatusLabel(status: 'idle' | 'connecting' | 'connected' | 'error' | 'closed') {
  if (status === 'connecting') return 'Connecting...'
  if (status === 'connected') return 'Connected'
  if (status === 'closed') return 'Closed'
  if (status === 'error') return 'Connection Error'
  return 'Idle'
}

export function TerminalViewer({ cwd }: TerminalViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { status, errorMessage, reconnect } = useWebTerminalSession({
    containerRef,
    cwd,
    isActive: true,
  })

  const statusLabel = useMemo(() => getStatusLabel(status), [status])

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-10 px-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Typography variant="p" className="text-sm text-foreground">
            Terminal
          </Typography>
          <Typography variant="p" className="text-xs text-muted-foreground">
            {statusLabel}
          </Typography>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reconnect}
          title="Reconnect terminal"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {errorMessage && (
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <Typography variant="p" className="text-xs text-destructive">
            {errorMessage}
          </Typography>
        </div>
      )}

      <div className="flex-1 min-h-0 p-2">
        <div ref={containerRef} className="h-full w-full rounded-md border border-border bg-background overflow-hidden" />
      </div>
    </div>
  )
}

export default TerminalViewer
