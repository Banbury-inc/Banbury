import axios from 'axios'
import { ApiService } from '../../../backend/api/apiService'

const GITHUB_STATUS_TIMEOUT_MS = 5000

export interface GitHubConnectionStatus {
  connected: boolean
  username?: string
  name?: string
  avatar_url?: string
}

export async function checkGitHubConnectionStatus(): Promise<GitHubConnectionStatus> {
  try {
    const response = await axios.get<GitHubConnectionStatus>(
      `${ApiService.baseURL}/authentication/github/status/`,
      { timeout: GITHUB_STATUS_TIMEOUT_MS }
    )

    return response.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const isConnectionUnavailable = error.code === 'ECONNABORTED' || status === 401 || status === 403

      if (isConnectionUnavailable) return { connected: false }
    }

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

