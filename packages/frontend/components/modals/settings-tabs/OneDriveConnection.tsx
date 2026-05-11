import { useState, useEffect } from 'react'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import { Typography } from '../../common/ui/typography'
import { CONFIG } from '../../../config/config'
import { OneDriveIcon } from '../../icons/OneDriveIcon'
import { 
  checkOneDriveConnectionStatus, 
  initiateOneDriveOAuth, 
  disconnectOneDriveAccount, 
  type OneDriveConnectionStatus 
} from '../../handlers/onedrive-connection'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function OneDriveConnection() {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<OneDriveConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      const status = await checkOneDriveConnectionStatus()
      setConnectionStatus(status)
    } catch (error) {
      console.error('Error checking OneDrive connection status:', error)
      setConnectionStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true)
      const backendUrl = CONFIG.url
      const callbackUrl = `${backendUrl}/authentication/onedrive/oauth_callback/`
      const { authUrl } = await initiateOneDriveOAuth({ callbackUrl })
      window.location.href = authUrl
    } catch (error) {
      console.error('Error initiating OneDrive connection:', error)
      toast({
        title: 'Connection failed',
        description: getErrorMessage(error, 'Failed to connect to OneDrive'),
        variant: 'destructive'
      })
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    try {
      setDisconnecting(true)
      await disconnectOneDriveAccount()
      setConnectionStatus({ connected: false })
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from OneDrive'
      })
    } catch (error) {
      console.error('Error disconnecting OneDrive account:', error)
      toast({
        title: 'Disconnection failed',
        description: getErrorMessage(error, 'Failed to disconnect from OneDrive'),
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
        <Typography variant="small" className="text-muted-foreground">Checking OneDrive connection...</Typography>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${connectionStatus.connected ? 'bg-primary/10' : 'bg-muted'}`}>
          <OneDriveIcon size={20} className={connectionStatus.connected ? '' : 'opacity-60'} />
        </div>
        <div>
          <Typography variant="small" className="font-medium text-foreground">OneDrive</Typography>
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
            <>
              <OneDriveIcon size={16} className="mr-2" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  )
}

