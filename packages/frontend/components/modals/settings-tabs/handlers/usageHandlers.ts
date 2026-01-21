import { ApiService } from '../../../../../backend/api/apiService'

export interface UsageSummary {
  subscription: 'free' | 'pro'
  tokens: {
    used: number
    limit: number | null
    unlimited: boolean
    reset_at: string
  }
  storage: {
    used: number
    limit: number | null
    unlimited: boolean
  }
}

export interface UsageSummaryResult {
  success: boolean
  data?: UsageSummary
  error?: string
}

export interface DailyTokenUsage {
  date: string
  tokens: number
}

export interface TokenUsageHistory {
  result: string
  daily_usage: DailyTokenUsage[]
  total_tokens: number
  month: string
}

export interface TokenUsageHistoryResult {
  success: boolean
  data?: TokenUsageHistory
  error?: string
}

export async function getUsageSummary(): Promise<UsageSummaryResult> {
  try {
    const response = await ApiService.get<{
      result: string
      subscription: 'free' | 'pro'
      tokens: {
        used: number
        limit: number | null
        unlimited: boolean
        reset_at: string
      }
      storage: {
        used: number
        limit: number | null
        unlimited: boolean
      }
    }>('/users/usage_summary/')

    if (response.result === 'success') {
      return {
        success: true,
        data: {
          subscription: response.subscription,
          tokens: response.tokens,
          storage: response.storage
        }
      }
    }
    
    return {
      success: false,
      error: 'Failed to fetch usage summary'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch usage summary'
    }
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`
  }
  return tokens.toLocaleString()
}

export function formatResetDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export async function getTokenUsageHistory(): Promise<TokenUsageHistoryResult> {
  try {
    const response = await ApiService.get<TokenUsageHistory>('/users/token_usage_history/')

    if (response.result === 'success') {
      return {
        success: true,
        data: response
      }
    }
    
    return {
      success: false,
      error: 'Failed to fetch token usage history'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch token usage history'
    }
  }
}
