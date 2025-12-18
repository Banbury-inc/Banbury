import { ApiService } from '../../../backend/api/apiService'

export interface OutlookConnectionStatus {
  connected: boolean
  accountEmail?: string
  accountName?: string
}

export async function checkOutlookConnectionStatus(): Promise<OutlookConnectionStatus> {
  try {
    const response = await ApiService.get('/authentication/outlook/status/') as OutlookConnectionStatus
    return response
  } catch (error: any) {
    // Handle 401 Unauthorized or other errors gracefully - user is not authenticated or not connected
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { connected: false }
    }
    // For other errors, still return not connected but rethrow for logging
    console.error('Error checking Outlook connection status:', error)
    return { connected: false }
  }
}

export async function initiateOutlookOAuth({ callbackUrl }: { callbackUrl: string }): Promise<{ authUrl: string }> {
  const response = await ApiService.post('/authentication/outlook/initiate_oauth/', {
    callback_url: callbackUrl
  }) as any

  if (!response?.auth_url) throw new Error('No authorization URL received')
  return { authUrl: response.auth_url as string }
}

export async function disconnectOutlookAccount(): Promise<void> {
  await ApiService.post('/authentication/outlook/disconnect/')
}

