import { useState, useEffect } from 'react'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import { Typography } from '../../common/ui/typography'
import { CONFIG } from '../../../config/config'
import { SlackIcon } from '../../icons'
import { ConnectionIconFrame } from './ConnectionIconFrame'
import { 
  checkSlackConnectionStatus, 
  initiateSlackOAuth, 
  disconnectSlackAccount, 
  type SlackConnectionStatus 
} from '../../handlers/slack-connection'

interface SlackConnectionProps {
  cachedConnectionStatus?: SlackConnectionStatus
  shouldLoadStatus?: boolean
  onStatusChange?: (status: SlackConnectionStatus) => void
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export const SlackConnection = ({
  cachedConnectionStatus,
  shouldLoadStatus = true,
  onStatusChange,
}: SlackConnectionProps) => {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<SlackConnectionStatus>(cachedConnectionStatus ?? { connected: false })
  const [loading, setLoading] = useState(shouldLoadStatus && !cachedConnectionStatus)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (cachedConnectionStatus) {
      setConnectionStatus(cachedConnectionStatus)
      setLoading(false)
      return
    }

    if (shouldLoadStatus) loadStatus()
  }, [cachedConnectionStatus, shouldLoadStatus])

  async function loadStatus() {
    try {
      setLoading(true)
      const status = await checkSlackConnectionStatus()
      setConnectionStatus(status)
      onStatusChange?.(status)
    } catch (error) {
      console.error('Error checking Slack connection status:', error)
      setConnectionStatus({ connected: false })
      onStatusChange?.({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true)
      const backendUrl = CONFIG.url
      const callbackUrl = `${backendUrl}/authentication/slack/oauth_callback/`
      const { authUrl } = await initiateSlackOAuth({ callbackUrl })
      window.location.href = authUrl
    } catch (error) {
      console.error('Error initiating Slack connection:', error)
      toast({
        title: 'Connection failed',
        description: getErrorMessage(error, 'Failed to connect to Slack workspace'),
        variant: 'destructive'
      })
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    try {
      setDisconnecting(true)
      await disconnectSlackAccount()
      setConnectionStatus({ connected: false })
      onStatusChange?.({ connected: false })
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from Slack workspace'
      })
    } catch (error) {
      console.error('Error disconnecting Slack account:', error)
      toast({
        title: 'Disconnection failed',
        description: getErrorMessage(error, 'Failed to disconnect from Slack workspace'),
        variant: 'destructive'
      })
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-muted-foreground"></div>
        <Typography variant="small" className="text-muted-foreground">Checking Slack connection...</Typography>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <ConnectionIconFrame isActive={connectionStatus.connected}>
          <SlackIcon size={20} />
        </ConnectionIconFrame>
        <div>
          <Typography variant="small" className="font-medium text-foreground">Slack</Typography>
        </div>
      </div>

      {connectionStatus.connected ? (
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          disabled={disconnecting}
        >
          {disconnecting ? 'Disconnecting…' : 'Disconnect'}
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

