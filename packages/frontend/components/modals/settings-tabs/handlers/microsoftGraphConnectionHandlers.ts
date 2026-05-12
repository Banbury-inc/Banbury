import { CONFIG } from '../../../../config/config'
import {
  checkOutlookConnectionStatus,
  disconnectOutlookAccount,
  initiateOutlookOAuth,
  type OutlookConnectionStatus,
} from '../../../handlers/outlook-connection'

interface LoadMicrosoftGraphStatusParams {
  name: string
  setConnectionStatus: (status: OutlookConnectionStatus) => void
  setLoading: (isLoading: boolean) => void
  onStatusChange?: (status: OutlookConnectionStatus) => void
}

interface ConnectMicrosoftGraphParams {
  name: string
  connectErrorFallback: string
  setConnecting: (isConnecting: boolean) => void
  toast: (props: {
    title: string
    description: string
    variant?: 'destructive'
  }) => void
}

interface DisconnectMicrosoftGraphParams {
  name: string
  disconnectSuccessDescription: string
  disconnectErrorFallback: string
  setConnectionStatus: (status: OutlookConnectionStatus) => void
  setDisconnecting: (isDisconnecting: boolean) => void
  onStatusChange?: (status: OutlookConnectionStatus) => void
  toast: (props: {
    title: string
    description: string
    variant?: 'destructive'
  }) => void
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export async function handleLoadMicrosoftGraphStatus({
  name,
  setConnectionStatus,
  setLoading,
  onStatusChange,
}: LoadMicrosoftGraphStatusParams) {
  try {
    setLoading(true)
    const status = await checkOutlookConnectionStatus()
    setConnectionStatus(status)
    onStatusChange?.(status)
  } catch (error) {
    console.error(`Error checking ${name} connection status:`, error)
    setConnectionStatus({ connected: false })
    onStatusChange?.({ connected: false })
  } finally {
    setLoading(false)
  }
}

export async function handleConnectMicrosoftGraph({
  name,
  connectErrorFallback,
  setConnecting,
  toast,
}: ConnectMicrosoftGraphParams) {
  try {
    setConnecting(true)
    const callbackUrl = `${CONFIG.url}/authentication/outlook/oauth_callback/`
    const { authUrl } = await initiateOutlookOAuth({ callbackUrl })
    window.location.href = authUrl
  } catch (error) {
    console.error(`Error initiating ${name} connection:`, error)
    toast({
      title: 'Connection failed',
      description: getErrorMessage(error, connectErrorFallback),
      variant: 'destructive',
    })
  } finally {
    setConnecting(false)
  }
}

export async function handleDisconnectMicrosoftGraph({
  name,
  disconnectSuccessDescription,
  disconnectErrorFallback,
  setConnectionStatus,
  setDisconnecting,
  onStatusChange,
  toast,
}: DisconnectMicrosoftGraphParams) {
  try {
    setDisconnecting(true)
    await disconnectOutlookAccount()
    setConnectionStatus({ connected: false })
    onStatusChange?.({ connected: false })
    toast({
      title: 'Disconnected',
      description: disconnectSuccessDescription,
    })
  } catch (error) {
    console.error(`Error disconnecting ${name} account:`, error)
    toast({
      title: 'Disconnection failed',
      description: getErrorMessage(error, disconnectErrorFallback),
      variant: 'destructive',
    })
  } finally {
    setDisconnecting(false)
  }
}
