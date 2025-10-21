import { ApiService } from '../../services/apiService'

export interface SlackConnectionStatus {
  connected: boolean
  workspace_name?: string
  team_id?: string
  channel_count?: number
  bot_user_id?: string
}

export interface SlackOAuthResponse {
  authUrl: string
}

export async function checkSlackConnectionStatus(): Promise<SlackConnectionStatus> {
  try {
    const response = await ApiService.get('/slack/connection-status/') as any
    return {
      connected: response.connected || false,
      workspace_name: response.workspace_name,
      team_id: response.team_id,
      channel_count: response.channel_count,
      bot_user_id: response.bot_user_id
    }
  } catch (error) {
    console.error('Error checking Slack connection status:', error)
    return { connected: false }
  }
}

export async function initiateSlackOAuth(params: { 
  callbackUrl: string 
}): Promise<SlackOAuthResponse> {
  try {
    const response = await ApiService.post('/slack/initiate-oauth/', {
      callback_url: params.callbackUrl
    }) as any
    
    if (!response.auth_url) {
      throw new Error('No authorization URL received')
    }
    
    return { authUrl: response.auth_url }
  } catch (error: any) {
    console.error('Error initiating Slack OAuth:', error)
    throw new Error(error.message || 'Failed to initiate Slack connection')
  }
}

export async function disconnectSlackWorkspace(): Promise<void> {
  try {
    await ApiService.post('/slack/disconnect/', {})
  } catch (error: any) {
    console.error('Error disconnecting Slack workspace:', error)
    throw new Error(error.message || 'Failed to disconnect Slack workspace')
  }
}

export async function getSlackChannels(): Promise<Array<{ id: string; name: string; is_private: boolean }>> {
  try {
    const response = await ApiService.get('/slack/channels/') as any
    return response.channels || []
  } catch (error) {
    console.error('Error fetching Slack channels:', error)
    return []
  }
}

export async function testSlackConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await ApiService.post('/slack/test-connection/', {}) as any
    return {
      success: response.success || false,
      message: response.message || 'Connection test completed'
    }
  } catch (error: any) {
    console.error('Error testing Slack connection:', error)
    return {
      success: false,
      message: error.message || 'Failed to test Slack connection'
    }
  }
}