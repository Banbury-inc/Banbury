import { ApiService } from '../../../backend/api/apiService'

export interface OneDriveConnectionStatus {
  connected: boolean
  accountEmail?: string
  accountName?: string
}

export async function checkOneDriveConnectionStatus(): Promise<OneDriveConnectionStatus> {
  try {
    const response = await ApiService.get('/authentication/onedrive/status/') as OneDriveConnectionStatus
    return response
  } catch (error: any) {
    // Handle 401 Unauthorized or other errors gracefully - user is not authenticated or not connected
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { connected: false }
    }
    // For other errors, still return not connected but rethrow for logging
    console.error('Error checking OneDrive connection status:', error)
    return { connected: false }
  }
}

export async function initiateOneDriveOAuth({ callbackUrl }: { callbackUrl: string }): Promise<{ authUrl: string }> {
  const response = await ApiService.post('/authentication/onedrive/initiate_oauth/', {
    callback_url: callbackUrl
  }) as any

  if (!response?.auth_url) throw new Error('No authorization URL received')
  return { authUrl: response.auth_url as string }
}

export async function disconnectOneDriveAccount(): Promise<void> {
  await ApiService.post('/authentication/onedrive/disconnect/')
}

