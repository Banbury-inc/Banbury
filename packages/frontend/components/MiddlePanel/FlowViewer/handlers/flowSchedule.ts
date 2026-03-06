import { ApiService } from '../../../../../backend/api/apiService'
import { FlowItem, FlowSchedule, FlowSchedulePattern } from '../../../../pages/Workspaces/types'

interface SaveScheduleParams {
  flowId: string
  enabled: boolean
  pattern: FlowSchedulePattern
  time: string
  daysOfWeek: number[] | null
  dayOfMonth: number | null
  intervalMinutes: number | null
  timezone: string
  endDate: string | null
}

export async function saveFlowSchedule({
  flowId,
  enabled,
  pattern,
  time,
  daysOfWeek,
  dayOfMonth,
  intervalMinutes,
  timezone,
  endDate,
}: SaveScheduleParams): Promise<FlowItem> {
  return ApiService.Flows.updateSchedule(flowId, {
    schedule_enabled: enabled,
    schedule_pattern: enabled ? pattern : null,
    schedule_time: enabled ? time : null,
    schedule_days_of_week: enabled ? daysOfWeek : null,
    schedule_day_of_month: enabled ? dayOfMonth : null,
    schedule_interval_minutes: enabled ? intervalMinutes : null,
    schedule_timezone: timezone,
    schedule_end_date: endDate,
  })
}

export async function fetchFlowSchedule(flowId: string): Promise<FlowSchedule> {
  return ApiService.Flows.getSchedule(flowId)
}

export function formatNextRun(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Not scheduled'
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return 'Invalid date'

  const now = new Date()
  const diff = date.getTime() - now.getTime()

  if (diff < 0) return 'Overdue'
  if (diff < 60_000) return 'Less than a minute'
  if (diff < 3_600_000) {
    const mins = Math.round(diff / 60_000)
    return `in ${mins}m`
  }
  if (diff < 86_400_000) {
    const hours = Math.round(diff / 3_600_000)
    return `in ${hours}h`
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function describePattern(
  pattern: FlowSchedulePattern | null,
  time: string | null,
  daysOfWeek: number[] | null,
  dayOfMonth: number | null,
  intervalMinutes: number | null,
): string {
  if (!pattern) return 'No schedule'

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  switch (pattern) {
    case 'every_minute':
      return 'Every minute'
    case 'hourly':
      return time ? `Hourly at :${time.split(':')[1] ?? '00'}` : 'Hourly'
    case 'daily':
      return time ? `Daily at ${time}` : 'Daily'
    case 'weekly': {
      const days = (daysOfWeek ?? []).map(d => dayNames[d] ?? '?').join(', ')
      return time ? `Weekly on ${days} at ${time}` : `Weekly on ${days}`
    }
    case 'monthly':
      return time
        ? `Monthly on day ${dayOfMonth ?? 1} at ${time}`
        : `Monthly on day ${dayOfMonth ?? 1}`
    case 'custom_interval':
      return `Every ${intervalMinutes ?? 60} minutes`
    default:
      return 'Unknown schedule'
  }
}
