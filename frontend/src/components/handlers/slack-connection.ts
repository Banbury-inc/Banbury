import { ApiService } from '../../services/apiService'

export interface SlackConnectionStatus {
  connected: boolean
  teamName?: string
  userName?: string
}

export async function checkSlackConnectionStatus(): Promise<SlackConnectionStatus> {
  try {
    const response = await ApiService.get('/authentication/slack/status/') as SlackConnectionStatus
    return response
  } catch (error: any) {
    // Handle 401 Unauthorized or other errors gracefully - user is not authenticated or not connected
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { connected: false }
    }
    // For other errors, still return not connected but rethrow for logging
    console.error('Error checking Slack connection status:', error)
    return { connected: false }
  }
}

export async function initiateSlackOAuth({ callbackUrl }: { callbackUrl: string }): Promise<{ authUrl: string }> {
  const response = await ApiService.post('/authentication/slack/initiate_oauth/', {
    callback_url: callbackUrl
  }) as any

  if (!response?.auth_url) throw new Error('No authorization URL received')
  return { authUrl: response.auth_url as string }
}

export async function disconnectSlackAccount(): Promise<void> {
  await ApiService.post('/authentication/slack/disconnect/')
}

