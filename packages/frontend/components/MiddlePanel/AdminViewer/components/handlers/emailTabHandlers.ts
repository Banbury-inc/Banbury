import type { Dispatch, SetStateAction } from 'react'
import axios from 'axios'
import { ApiService } from '../../../../../../backend/api/apiService'
import type { User } from '../../types/adminTypes'

// Bulk sends can take a while (one SMTP send per recipient), so this request
// gets a much longer timeout than the 30s axios default
const SEND_EMAIL_TIMEOUT_MS = 5 * 60 * 1000

export interface SendEmailSummary {
  sent: number
  skippedOptedOut: number
  missingEmail: number
  notFound: number
  failed: number
}

interface SendMarketingEmailResponse {
  result?: string
  message?: string
  sent?: number
  skipped_opted_out?: string[]
  missing_email?: string[]
  not_found?: string[]
  failed?: { user_id: string; error: string }[]
}

interface HandleSendMarketingEmailParams {
  subject: string
  body: string
  selectedUserIds: string[]
  setIsSending: Dispatch<SetStateAction<boolean>>
  setSendError: Dispatch<SetStateAction<string | null>>
  setSendSummary: Dispatch<SetStateAction<SendEmailSummary | null>>
  setSelectedUserIds: Dispatch<SetStateAction<string[]>>
}

export function isUserSelectable(user: User): boolean {
  return Boolean(user.email) && !user.marketingEmailsOptOut
}

export function toggleUserSelection(
  userId: string,
  setSelectedUserIds: Dispatch<SetStateAction<string[]>>
) {
  setSelectedUserIds(prev => (
    prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
  ))
}

export function toggleSelectAll(
  users: User[],
  selectedUserIds: string[],
  setSelectedUserIds: Dispatch<SetStateAction<string[]>>
) {
  const selectableIds = users.filter(isUserSelectable).map(user => user._id)
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedUserIds.includes(id))
  setSelectedUserIds(allSelected ? [] : selectableIds)
}

export async function handleSendMarketingEmail({
  subject,
  body,
  selectedUserIds,
  setIsSending,
  setSendError,
  setSendSummary,
  setSelectedUserIds
}: HandleSendMarketingEmailParams) {
  if (!subject.trim() || !body.trim() || selectedUserIds.length === 0) return

  setIsSending(true)
  setSendError(null)
  setSendSummary(null)

  try {
    const { data: response } = await axios.post<SendMarketingEmailResponse>(
      `${ApiService.baseURL}/users/send_marketing_email/`,
      {
        subject: subject.trim(),
        body: body.trim(),
        user_ids: selectedUserIds
      },
      { timeout: SEND_EMAIL_TIMEOUT_MS }
    )

    if (response.result !== 'success') {
      setSendError(response.message || 'Failed to send emails')
      return
    }

    setSendSummary({
      sent: response.sent || 0,
      skippedOptedOut: response.skipped_opted_out?.length || 0,
      missingEmail: response.missing_email?.length || 0,
      notFound: response.not_found?.length || 0,
      failed: response.failed?.length || 0
    })
    setSelectedUserIds([])
  } catch (error) {
    const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    const fallbackMessage = error instanceof Error ? error.message : 'Failed to send emails'
    setSendError(responseMessage || fallbackMessage)
  } finally {
    setIsSending(false)
  }
}
