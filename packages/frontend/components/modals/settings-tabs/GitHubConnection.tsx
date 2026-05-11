import { useState, useEffect } from 'react'
import { Github } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import { Typography } from '../../common/ui/typography'
import { CONFIG } from '../../../config/config'
import { 
  checkGitHubConnectionStatus, 
  initiateGitHubOAuth, 
  disconnectGitHubAccount, 
  type GitHubConnectionStatus 
} from '../../handlers/github-connection'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

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
    } catch (error) {
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
    } catch (error) {
      console.error('Error initiating GitHub connection:', error)
      toast({
        title: 'Connection failed',
        description: getErrorMessage(error, 'Failed to connect to GitHub'),
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
    } catch (error) {
      console.error('Error disconnecting GitHub account:', error)
      toast({
        title: 'Disconnection failed',
        description: getErrorMessage(error, 'Failed to disconnect from GitHub'),
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
        <Typography variant="small" className="text-muted-foreground">Checking GitHub connection...</Typography>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${connectionStatus.connected ? 'bg-primary/10' : 'bg-muted'}`}>
          <Github className={`h-5 w-5 ${connectionStatus.connected ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <Typography variant="small" className="font-medium text-foreground">GitHub</Typography>
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
              <Github className="h-4 w-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  )
}

