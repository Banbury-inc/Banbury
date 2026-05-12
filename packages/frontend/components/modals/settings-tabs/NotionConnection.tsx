import { useState, useEffect } from 'react'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import { Typography } from '../../common/ui/typography'
import { NotionIcon } from '../../icons'
import { ConnectionIconFrame } from './ConnectionIconFrame'
import {
  type NotionConnectionStatus
} from '../../handlers/notion-connection'
import {
  connectNotionAccount,
  disconnectNotionConnection,
  loadNotionConnectionStatus
} from './handlers/notionConnectionHandlers'

interface NotionConnectionProps {
  cachedConnectionStatus?: NotionConnectionStatus
  shouldLoadStatus?: boolean
  onStatusChange?: (status: NotionConnectionStatus) => void
}

export const NotionConnection = ({
  cachedConnectionStatus,
  shouldLoadStatus = true,
  onStatusChange,
}: NotionConnectionProps) => {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<NotionConnectionStatus>(cachedConnectionStatus ?? { connected: false })
  const [loading, setLoading] = useState(shouldLoadStatus && !cachedConnectionStatus)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (cachedConnectionStatus) {
      setConnectionStatus(cachedConnectionStatus)
      setLoading(false)
      return
    }

    if (shouldLoadStatus) void loadNotionConnectionStatus({ setLoading, setConnectionStatus, onStatusChange })
  }, [cachedConnectionStatus, shouldLoadStatus])

  function handleConnect() {
    void connectNotionAccount({ setConnecting, toast })
  }

  function handleDisconnect() {
    void disconnectNotionConnection({ setDisconnecting, setConnectionStatus, onStatusChange, toast })
  }

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-muted-foreground"></div>
        <Typography variant="small" className="text-muted-foreground">Checking Notion connection...</Typography>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <ConnectionIconFrame isActive={connectionStatus.connected}>
          <NotionIcon size={20} />
        </ConnectionIconFrame>
        <div>
          <Typography variant="small" className="font-medium text-foreground">Notion</Typography>
          {connectionStatus.connected && connectionStatus.workspace?.name ? (
            <Typography variant="muted" className="text-xs">
              {connectionStatus.workspace.name}
            </Typography>
          ) : null}
        </div>
      </div>

      {connectionStatus.connected ? (
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          disabled={disconnecting}
        >
          {disconnecting ? 'Disconnecting...' : 'Disconnect'}
        </Button>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={connecting}
          size="sm"
        >
          {connecting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
              Connecting...
            </>
          ) : (
            'Connect'
          )}
        </Button>
      )}
    </div>
  )
}
