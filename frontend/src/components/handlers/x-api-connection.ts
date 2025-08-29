import { ApiService } from '../../services/apiService'

export interface XApiConnectionStatus {
  connected: boolean
  username?: string
  user_id?: string
  last_verified?: string
}

export async function checkXConnectionStatus(): Promise<XApiConnectionStatus> {
  const response = await ApiService.get('/authentication/x_api/connection_status/') as XApiConnectionStatus
  return response
}

export async function initiateXOAuth({ callbackUrl }: { callbackUrl: string }): Promise<{ authUrl: string }> {
  const response = await ApiService.post('/authentication/x_api/initiate_oauth/', {
    callback_url: callbackUrl
  }) as any

  if (!response?.auth_url) throw new Error('No authorization URL received')
  return { authUrl: response.auth_url as string }
}

export async function disconnectXAccount(): Promise<void> {
  await ApiService.post('/authentication/x_api/disconnect/')
}

export async function testXConnection(): Promise<{ success: boolean; error?: string }> {
  const response = await ApiService.get('/authentication/x_api/test_connection/') as any
  return { success: Boolean(response?.success), error: response?.error }
}


