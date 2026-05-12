import type { Dispatch, SetStateAction } from 'react'
import { CONFIG } from '../../../../config/config'
import {
  checkNotionConnectionStatus,
  disconnectNotionAccount,
  initiateNotionOAuth,
  type NotionConnectionStatus
} from '../../../handlers/notion-connection'
import { useToast } from '../../../common/ui/use-toast'

type Toast = ReturnType<typeof useToast>['toast']

interface LoadNotionStatusParams {
  setLoading: Dispatch<SetStateAction<boolean>>
  setConnectionStatus: Dispatch<SetStateAction<NotionConnectionStatus>>
  onStatusChange?: (status: NotionConnectionStatus) => void
}

interface ConnectNotionParams {
  setConnecting: Dispatch<SetStateAction<boolean>>
  toast: Toast
}

interface DisconnectNotionParams {
  setDisconnecting: Dispatch<SetStateAction<boolean>>
  setConnectionStatus: Dispatch<SetStateAction<NotionConnectionStatus>>
  onStatusChange?: (status: NotionConnectionStatus) => void
  toast: Toast
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export async function loadNotionConnectionStatus({
  setLoading,
  setConnectionStatus,
  onStatusChange,
}: LoadNotionStatusParams) {
  try {
    setLoading(true)
    const status = await checkNotionConnectionStatus()
    setConnectionStatus(status)
    onStatusChange?.(status)
  } catch (error) {
    console.error('Error checking Notion connection status:', error)
    setConnectionStatus({ connected: false })
    onStatusChange?.({ connected: false })
  } finally {
    setLoading(false)
  }
}

export async function connectNotionAccount({
  setConnecting,
  toast,
}: ConnectNotionParams) {
  try {
    setConnecting(true)
    const callbackUrl = `${CONFIG.url}/authentication/notion/oauth_callback/`
    const { authUrl } = await initiateNotionOAuth({ callbackUrl })
    window.location.href = authUrl
  } catch (error) {
    console.error('Error initiating Notion connection:', error)
    toast({
      title: 'Connection failed',
      description: getErrorMessage(error, 'Failed to connect to Notion'),
      variant: 'destructive'
    })
  } finally {
    setConnecting(false)
  }
}

export async function disconnectNotionConnection({
  setDisconnecting,
  setConnectionStatus,
  onStatusChange,
  toast,
}: DisconnectNotionParams) {
  try {
    setDisconnecting(true)
    await disconnectNotionAccount()
    setConnectionStatus({ connected: false })
    onStatusChange?.({ connected: false })
    toast({
      title: 'Disconnected',
      description: 'Successfully disconnected from Notion'
    })
  } catch (error) {
    console.error('Error disconnecting Notion account:', error)
    toast({
      title: 'Disconnection failed',
      description: getErrorMessage(error, 'Failed to disconnect from Notion'),
      variant: 'destructive'
    })
  } finally {
    setDisconnecting(false)
  }
}
