import { ApiService } from '../../../backend/api/apiService'

export interface NotionConnectionStatus {
  connected: boolean
  workspace?: {
    id?: string
    name?: string
    icon?: string
  }
  botId?: string
  connectedAt?: string
}

export async function checkNotionConnectionStatus(): Promise<NotionConnectionStatus> {
  try {
    const response = await ApiService.get('/authentication/notion/status/') as NotionConnectionStatus
    return response
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { connected: false }
    }

    console.error('Error checking Notion connection status:', error)
    return { connected: false }
  }
}

export async function initiateNotionOAuth({ callbackUrl }: { callbackUrl: string }): Promise<{ authUrl: string }> {
  const response = await ApiService.post('/authentication/notion/initiate_oauth/', {
    callback_url: callbackUrl
  }) as any

  if (!response?.auth_url) throw new Error('No authorization URL received')
  return { authUrl: response.auth_url as string }
}

export async function disconnectNotionAccount(): Promise<void> {
  await ApiService.post('/authentication/notion/disconnect/')
}
