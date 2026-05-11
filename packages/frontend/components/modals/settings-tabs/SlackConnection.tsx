import { useState, useEffect } from 'react'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import { Typography } from '../../common/ui/typography'
import { CONFIG } from '../../../config/config'
import { SlackIcon } from '../../icons'
import { 
  checkSlackConnectionStatus, 
  initiateSlackOAuth, 
  disconnectSlackAccount, 
  type SlackConnectionStatus 
} from '../../handlers/slack-connection'

export const SlackConnection = () => {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<SlackConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      const status = await checkSlackConnectionStatus()
      setConnectionStatus(status)
    } catch (error: any) {
      console.error('Error checking Slack connection status:', error)
      setConnectionStatus({ connected: false })
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
    } catch (error: any) {
      console.error('Error initiating Slack connection:', error)
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to Slack workspace',
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
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from Slack workspace'
      })
    } catch (error: any) {
      console.error('Error disconnecting Slack account:', error)
      toast({
        title: 'Disconnection failed',
        description: error.message || 'Failed to disconnect from Slack workspace',
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
        <Typography variant="small" className="text-zinc-400">Checking Slack connection...</Typography>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${connectionStatus.connected ? 'bg-green-900/20' : 'bg-zinc-800'}`}>
          <SlackIcon size={20} />
        </div>
        <div>
          <Typography variant="small" className="text-white font-medium">Slack</Typography>
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
              <SlackIcon size={16} className="mr-2" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  )
}

