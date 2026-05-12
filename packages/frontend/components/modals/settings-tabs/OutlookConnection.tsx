import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import { Typography } from '../../common/ui/typography'
import { OutlookIcon } from '../../icons/OutlookIcon'
import { TeamsIcon } from '../../icons/TeamsIcon'
import { ConnectionIconFrame } from './ConnectionIconFrame'
import type { OutlookConnectionStatus } from '../../handlers/outlook-connection'
import {
  handleConnectMicrosoftGraph,
  handleDisconnectMicrosoftGraph,
  handleLoadMicrosoftGraphStatus,
} from './handlers/microsoftGraphConnectionHandlers'

interface MicrosoftGraphConnectionProps {
  name: string
  icon: ReactNode
  loadingLabel: string
  statusDescription?: string
  connectErrorFallback: string
  disconnectSuccessDescription: string
  disconnectErrorFallback: string
  cachedConnectionStatus?: OutlookConnectionStatus
  shouldLoadStatus?: boolean
  onStatusChange?: (status: OutlookConnectionStatus) => void
}

function MicrosoftGraphConnection({
  name,
  icon,
  loadingLabel,
  statusDescription,
  connectErrorFallback,
  disconnectSuccessDescription,
  disconnectErrorFallback,
  cachedConnectionStatus,
  shouldLoadStatus = true,
  onStatusChange,
}: MicrosoftGraphConnectionProps) {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<OutlookConnectionStatus>(cachedConnectionStatus ?? { connected: false })
  const [loading, setLoading] = useState(shouldLoadStatus && !cachedConnectionStatus)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (cachedConnectionStatus) {
      setConnectionStatus(cachedConnectionStatus)
      setLoading(false)
      return
    }

    if (shouldLoadStatus) handleLoadMicrosoftGraphStatus({
      name,
      setConnectionStatus,
      setLoading,
      onStatusChange,
    })
  }, [cachedConnectionStatus, name, shouldLoadStatus])

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-muted-foreground"></div>
        <Typography variant="small" className="text-muted-foreground">{loadingLabel}</Typography>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <ConnectionIconFrame isActive={connectionStatus.connected}>
          {icon}
        </ConnectionIconFrame>
        <div>
          <Typography variant="small" className="font-medium text-foreground">{name}</Typography>
          {statusDescription ? (
            <Typography variant="caption" className="text-muted-foreground">
              {statusDescription}
            </Typography>
          ) : null}
        </div>
      </div>

      {connectionStatus.connected ? (
        <Button
          onClick={() =>
            handleDisconnectMicrosoftGraph({
              name,
              disconnectSuccessDescription,
              disconnectErrorFallback,
              setConnectionStatus,
              setDisconnecting,
              onStatusChange,
              toast,
            })
          }
          variant="outline"
          size="sm"
          disabled={disconnecting}
        >
          {disconnecting ? 'Disconnecting…' : 'Disconnect'}
        </Button>
      ) : (
        <Button
          onClick={() =>
            handleConnectMicrosoftGraph({
              name,
              connectErrorFallback,
              setConnecting,
              toast,
            })
          }
          disabled={connecting}
          size="sm"
        >
          {connecting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
              Connecting…
            </>
          ) : (
            'Connect'
          )}
        </Button>
      )}
    </div>
  )
}

interface OutlookConnectionProps {
  cachedConnectionStatus?: OutlookConnectionStatus
  shouldLoadStatus?: boolean
  onStatusChange?: (status: OutlookConnectionStatus) => void
}

export function OutlookConnection({
  cachedConnectionStatus,
  shouldLoadStatus,
  onStatusChange,
}: OutlookConnectionProps) {
  return (
    <MicrosoftGraphConnection
      name="Outlook"
      icon={<OutlookIcon size={20} />}
      loadingLabel="Checking Outlook connection..."
      connectErrorFallback="Failed to connect to Outlook"
      disconnectSuccessDescription="Successfully disconnected from Outlook"
      disconnectErrorFallback="Failed to disconnect from Outlook"
      cachedConnectionStatus={cachedConnectionStatus}
      shouldLoadStatus={shouldLoadStatus}
      onStatusChange={onStatusChange}
    />
  )
}

export function TeamsConnection({
  cachedConnectionStatus,
  shouldLoadStatus,
  onStatusChange,
}: OutlookConnectionProps) {
  return (
    <MicrosoftGraphConnection
      name="Microsoft Teams"
      icon={<TeamsIcon size={20} />}
      loadingLabel="Checking Microsoft Teams connection..."
      statusDescription="Uses the Outlook/Microsoft Graph connection; reconnect to grant Teams scopes."
      connectErrorFallback="Failed to connect to Microsoft Teams"
      disconnectSuccessDescription="Successfully disconnected from Microsoft Graph"
      disconnectErrorFallback="Failed to disconnect Microsoft Teams"
      cachedConnectionStatus={cachedConnectionStatus}
      shouldLoadStatus={shouldLoadStatus}
      onStatusChange={onStatusChange}
    />
  )
}
