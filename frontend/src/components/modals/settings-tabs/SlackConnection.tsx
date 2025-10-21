import { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { useToast } from '../../ui/use-toast'
import { CONFIG } from '../../../config/config'
import { SlackIcon } from '../../icons/SlackIcon'
import { 
  checkSlackConnectionStatus, 
  initiateSlackOAuth, 
  disconnectSlackWorkspace,
  testSlackConnection,
  type SlackConnectionStatus 
} from '../../handlers/slack-api-connection'
import { MessageSquare, Users, Hash, CheckCircle } from 'lucide-react'

export function SlackConnection() {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<SlackConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [testing, setTesting] = useState(false)

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
      const callbackUrl = `${backendUrl}/slack/oauth/callback/`
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
      await disconnectSlackWorkspace()
      setConnectionStatus({ connected: false })
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from Slack workspace'
      })
    } catch (error: any) {
      console.error('Error disconnecting Slack workspace:', error)
      toast({
        title: 'Disconnection failed',
        description: error.message || 'Failed to disconnect from Slack workspace',
        variant: 'destructive'
      })
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleTestConnection() {
    try {
      setTesting(true)
      const result = await testSlackConnection()
      toast({
        title: result.success ? 'Connection successful' : 'Connection failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      })
    } catch (error: any) {
      toast({
        title: 'Test failed',
        description: 'Failed to test Slack connection',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center text-zinc-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-400 mr-2"></div>
        Checking Slack connection...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${connectionStatus.connected ? 'bg-purple-900/20' : 'bg-zinc-800'}`}>
            <SlackIcon size={20} />
          </div>
          <div>
            <h3 className="text-zinc-900 dark:text-white text-sm font-medium">Slack</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">
              {connectionStatus.connected 
                ? `Connected to ${connectionStatus.workspace_name || 'workspace'}`
                : 'Not connected'}
            </p>
          </div>
        </div>

        {connectionStatus.connected ? (
          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              variant="outline"
              size="sm"
              disabled={testing}
              className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              disabled={disconnecting}
              className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={connecting}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
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

      {connectionStatus.connected && (
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Workspace Information</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-300">Workspace:</span>
              <span className="text-zinc-900 dark:text-white font-medium">
                {connectionStatus.workspace_name || 'Unknown'}
              </span>
            </div>

            {connectionStatus.channel_count !== undefined && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-300">Channels:</span>
                <span className="text-zinc-900 dark:text-white font-medium">
                  {connectionStatus.channel_count}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <p className="text-zinc-900 dark:text-white font-medium">Banbury AI Agent Active</p>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
                  Message @banbury in any channel to interact with your AI assistant
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-3">
            <h5 className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">How to use:</h5>
            <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
              <li>• Mention @banbury in any channel to start a conversation</li>
              <li>• Send direct messages to @banbury for private interactions</li>
              <li>• Use commands like "help" or "status" to get started</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}