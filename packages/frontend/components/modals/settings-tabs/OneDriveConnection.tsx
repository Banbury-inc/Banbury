import { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { useToast } from '../../ui/use-toast'
import { CONFIG } from '../../../config/config'
import { OneDriveIcon } from '../../icons/OneDriveIcon'
import { 
  checkOneDriveConnectionStatus, 
  initiateOneDriveOAuth, 
  disconnectOneDriveAccount, 
  type OneDriveConnectionStatus 
} from '../../handlers/onedrive-connection'

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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error initiating OneDrive connection:', error)
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to OneDrive',
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
    } catch (error: any) {
      console.error('Error disconnecting OneDrive account:', error)
      toast({
        title: 'Disconnection failed',
        description: error.message || 'Failed to disconnect from OneDrive',
        variant: 'destructive'
      })
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center text-zinc-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-400 mr-2"></div>
        Checking OneDrive connection...
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${connectionStatus.connected ? 'bg-blue-900/20' : 'bg-zinc-800'}`}>
          <OneDriveIcon size={20} className={connectionStatus.connected ? '' : 'opacity-60'} />
        </div>
        <div>
          <h3 className="text-white text-sm font-medium">OneDrive</h3>
          <p className="text-zinc-400 text-xs">
            {connectionStatus.connected 
              ? `Connected${connectionStatus.accountEmail ? ` as ${connectionStatus.accountEmail}` : ''}${connectionStatus.accountName ? ` (${connectionStatus.accountName})` : ''}`
              : 'Not connected'}
          </p>
        </div>
      </div>

      {connectionStatus.connected ? (
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          disabled={disconnecting}
          className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

