import { ApiService } from '../../../backend/api/apiService'

export interface DropboxConnectionStatus {
  connected: boolean
  accountEmail?: string
  accountName?: string
}

export async function checkDropboxConnectionStatus(): Promise<DropboxConnectionStatus> {
  try {
    const response = await ApiService.get('/authentication/dropbox/status/') as DropboxConnectionStatus
    return response
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) return { connected: false }
    console.error('Error checking Dropbox connection status:', error)
    return { connected: false }
  }
}

export async function initiateDropboxOAuth({ callbackUrl }: { callbackUrl: string }): Promise<{ authUrl: string }> {
  const response = await ApiService.post('/authentication/dropbox/initiate_oauth/', {
    callback_url: callbackUrl
  }) as any

  if (!response?.auth_url) throw new Error('No authorization URL received')
  return { authUrl: response.auth_url as string }
}

export async function disconnectDropboxAccount(): Promise<void> {
  await ApiService.post('/authentication/dropbox/disconnect/')
}
