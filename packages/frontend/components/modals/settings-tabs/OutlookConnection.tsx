import { useState, useEffect } from 'react'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import { Typography } from '../../common/ui/typography'
import { CONFIG } from '../../../config/config'
import { OutlookIcon } from '../../icons/OutlookIcon'
import { 
  checkOutlookConnectionStatus, 
  initiateOutlookOAuth, 
  disconnectOutlookAccount, 
  type OutlookConnectionStatus 
} from '../../handlers/outlook-connection'

export function OutlookConnection() {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<OutlookConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      const status = await checkOutlookConnectionStatus()
      setConnectionStatus(status)
    } catch (error: any) {
      console.error('Error checking Outlook connection status:', error)
      setConnectionStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true)
      const backendUrl = CONFIG.url
      const callbackUrl = `${backendUrl}/authentication/outlook/oauth_callback/`
      const { authUrl } = await initiateOutlookOAuth({ callbackUrl })
      window.location.href = authUrl
    } catch (error: any) {
      console.error('Error initiating Outlook connection:', error)
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to Outlook',
        variant: 'destructive'
      })
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    try {
      setDisconnecting(true)
      await disconnectOutlookAccount()
      setConnectionStatus({ connected: false })
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from Outlook'
      })
    } catch (error: any) {
      console.error('Error disconnecting Outlook account:', error)
      toast({
        title: 'Disconnection failed',
        description: error.message || 'Failed to disconnect from Outlook',
        variant: 'destructive'
      })
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-400 mr-2"></div>
        <Typography variant="small" className="text-zinc-400">Checking Outlook connection...</Typography>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${connectionStatus.connected ? 'bg-green-900/20' : 'bg-zinc-800'}`}>
          <OutlookIcon size={20} className={connectionStatus.connected ? '' : 'opacity-60'} />
        </div>
        <div>
          <Typography variant="small" className="text-white font-medium">Outlook</Typography>
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
              <OutlookIcon size={16} className="mr-2" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  )
}
