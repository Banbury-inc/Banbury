import { ApiService } from '../../../../../backend/api/apiService'

export interface NotificationSettings {
  marketingEmailsEnabled: boolean
}

interface SettingsApiResponse {
  result?: string
  settings?: {
    marketing_emails_enabled?: boolean
  } | null
}

interface UpdateSettingsApiResponse {
  result?: string
  message?: string
}

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  const response = await ApiService.post<SettingsApiResponse>('/settings/get_settings/')
  const marketingEmailsEnabled = response.settings?.marketing_emails_enabled

  return {
    marketingEmailsEnabled: typeof marketingEmailsEnabled === 'boolean' ? marketingEmailsEnabled : true,
  }
}

export async function saveMarketingEmailsPreference(marketingEmailsEnabled: boolean) {
  const response = await ApiService.post<UpdateSettingsApiResponse>('/settings/update_settings/', {
    marketing_emails_enabled: marketingEmailsEnabled,
  })

  if (response.result !== 'success') {
    throw new Error(response.message || 'Failed to update notification settings')
  }

  return response
}
