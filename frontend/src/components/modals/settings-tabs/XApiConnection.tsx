import { useState, useEffect } from 'react'
import { Twitter } from 'lucide-react'
import { Button } from '../../ui/button'
import { useToast } from '../../ui/use-toast'
import { CONFIG } from '../../../config/config'
import { 
  checkXConnectionStatus, 
  initiateXOAuth, 
  disconnectXAccount, 
  type XApiConnectionStatus 
} from '../../handlers/x-api-connection'

export const XApiConnection = () => {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<XApiConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      const status = await checkXConnectionStatus()
      setConnectionStatus(status)
    } catch (error: any) {
      console.error('Error checking X API connection status:', error)
      setConnectionStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true)
      const backendUrl = CONFIG.url
      const callbackUrl = `${backendUrl}/authentication/x_api/oauth_callback/`
      const { authUrl } = await initiateXOAuth({ callbackUrl })
      window.location.href = authUrl
    } catch (error: any) {
      console.error('Error initiating X connection:', error)
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to X account',
        variant: 'destructive'
      })
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    try {
      setDisconnecting(true)
      await disconnectXAccount()
      setConnectionStatus({ connected: false })
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from X account'
      })
    } catch (error: any) {
      console.error('Error disconnecting X account:', error)
      toast({
        title: 'Disconnection failed',
        description: error.message || 'Failed to disconnect from X account',
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
        Checking X connection...
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${connectionStatus.connected ? 'bg-green-900/20' : 'bg-zinc-800'}`}>
          <Twitter className={`h-5 w-5 ${connectionStatus.connected ? 'text-green-400' : 'text-zinc-400'}`} />
        </div>
        <div>
          <h3 className="text-white text-sm font-medium">X (Twitter)</h3>
          <p className="text-zinc-400 text-xs">
            {connectionStatus.connected 
              ? `Connected${connectionStatus.username ? ` as @${connectionStatus.username}` : ''}`
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
              <Twitter className="h-4 w-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  )
}
