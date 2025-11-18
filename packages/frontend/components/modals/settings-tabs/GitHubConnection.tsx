import { useState, useEffect } from 'react'
import { Github } from 'lucide-react'
import { Button } from '../../ui/button'
import { useToast } from '../../ui/use-toast'
import { CONFIG } from '../../../config/config'
import { 
  checkGitHubConnectionStatus, 
  initiateGitHubOAuth, 
  disconnectGitHubAccount, 
  type GitHubConnectionStatus 
} from '../../handlers/github-connection'

export const GitHubConnection = () => {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<GitHubConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      const status = await checkGitHubConnectionStatus()
      setConnectionStatus(status)
    } catch (error: any) {
      console.error('Error checking GitHub connection status:', error)
      setConnectionStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true)
      const backendUrl = CONFIG.url
      const callbackUrl = `${backendUrl}/authentication/github/oauth_callback/`
      const { authUrl } = await initiateGitHubOAuth({ callbackUrl })
      window.location.href = authUrl
    } catch (error: any) {
      console.error('Error initiating GitHub connection:', error)
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to GitHub',
        variant: 'destructive'
      })
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    try {
      setDisconnecting(true)
      await disconnectGitHubAccount()
      setConnectionStatus({ connected: false })
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from GitHub'
      })
    } catch (error: any) {
      console.error('Error disconnecting GitHub account:', error)
      toast({
        title: 'Disconnection failed',
        description: error.message || 'Failed to disconnect from GitHub',
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
        Checking GitHub connection...
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${connectionStatus.connected ? 'bg-green-900/20' : 'bg-zinc-800'}`}>
          <Github className={`h-5 w-5 ${connectionStatus.connected ? 'text-green-400' : 'text-zinc-400'}`} />
        </div>
        <div>
          <h3 className="text-white text-sm font-medium">GitHub</h3>
          <p className="text-zinc-400 text-xs">
            {connectionStatus.connected 
              ? `Connected${connectionStatus.username ? ` as ${connectionStatus.username}` : ''}${connectionStatus.name ? ` (${connectionStatus.name})` : ''}`
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
              <Github className="h-4 w-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  )
}

