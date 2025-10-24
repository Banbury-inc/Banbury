import { ApiService } from '../../services/apiService'

export interface GitHubConnectionStatus {
  connected: boolean
  username?: string
  name?: string
  avatar_url?: string
}

export async function checkGitHubConnectionStatus(): Promise<GitHubConnectionStatus> {
  try {
    const response = await ApiService.get('/authentication/github/status/') as GitHubConnectionStatus
    return response
  } catch (error: any) {
    // Handle 401 Unauthorized or other errors gracefully - user is not authenticated or not connected
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { connected: false }
    }
    // For other errors, still return not connected but rethrow for logging
    console.error('Error checking GitHub connection status:', error)
    return { connected: false }
  }
}

export async function initiateGitHubOAuth({ callbackUrl }: { callbackUrl: string }): Promise<{ authUrl: string }> {
  const response = await ApiService.post('/authentication/github/initiate_oauth/', {
    callback_url: callbackUrl
  }) as any

  if (!response?.auth_url) throw new Error('No authorization URL received')
  return { authUrl: response.auth_url as string }
}

export async function disconnectGitHubAccount(): Promise<void> {
  await ApiService.post('/authentication/github/disconnect/')
}

