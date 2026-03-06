'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, X, CalendarClock, Loader2, Check, Timer } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Switch } from '../../common/ui/switch'
import { Input } from '../../common/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../common/ui/select'
import { Typography } from '../../common/ui/typography'
import { FlowItem, FlowSchedulePattern } from '../../../pages/Workspaces/types'
import {
  saveFlowSchedule,
  formatNextRun,
  describePattern,
} from './handlers/flowSchedule'

interface FlowSchedulePanelProps {
  flow: FlowItem
  onClose: () => void
  onFlowUpdated?: (flow: FlowItem) => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
]

const PATTERN_OPTIONS: { value: FlowSchedulePattern; label: string }[] = [
  { value: 'every_minute', label: 'Every minute' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom_interval', label: 'Custom interval' },
]

function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

export function FlowSchedulePanel({ flow, onClose, onFlowUpdated }: FlowSchedulePanelProps) {
  const [enabled, setEnabled] = useState(flow.schedule_enabled ?? false)
  const [pattern, setPattern] = useState<FlowSchedulePattern>(
    flow.schedule_pattern ?? 'daily'
  )
  const [time, setTime] = useState(flow.schedule_time ?? '09:00')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    flow.schedule_days_of_week ?? [0, 1, 2, 3, 4]
  )
  const [dayOfMonth, setDayOfMonth] = useState(flow.schedule_day_of_month ?? 1)
  const [intervalMinutes, setIntervalMinutes] = useState(
    flow.schedule_interval_minutes ?? 60
  )
  const [timezone, setTimezone] = useState(flow.schedule_timezone ?? guessTimezone())
  const [endDate, setEndDate] = useState(flow.schedule_end_date ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setEnabled(flow.schedule_enabled ?? false)
    setPattern(flow.schedule_pattern ?? 'daily')
    setTime(flow.schedule_time ?? '09:00')
    setDaysOfWeek(flow.schedule_days_of_week ?? [0, 1, 2, 3, 4])
    setDayOfMonth(flow.schedule_day_of_month ?? 1)
    setIntervalMinutes(flow.schedule_interval_minutes ?? 60)
    setTimezone(flow.schedule_timezone ?? guessTimezone())
    setEndDate(flow.schedule_end_date ?? '')
  }, [flow.id])

  const toggleDay = useCallback((day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSaved(false)
    try {
      const updated = await saveFlowSchedule({
        flowId: flow.id,
        enabled,
        pattern,
        time,
        daysOfWeek: pattern === 'weekly' ? daysOfWeek : null,
        dayOfMonth: pattern === 'monthly' ? dayOfMonth : null,
        intervalMinutes: pattern === 'custom_interval' ? intervalMinutes : null,
        timezone,
        endDate: endDate || null,
      })
      onFlowUpdated?.(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }, [
    flow.id, enabled, pattern, time, daysOfWeek, dayOfMonth,
    intervalMinutes, timezone, endDate, onFlowUpdated,
  ])

  const showTimeField = pattern === 'hourly' || pattern === 'daily' || pattern === 'weekly' || pattern === 'monthly'

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
          <Typography variant="small" className="font-semibold text-foreground">
            Schedule
          </Typography>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Typography variant="small" className="font-medium text-foreground">
              Enable schedule
            </Typography>
            <Typography variant="xs" className="text-muted-foreground">
              Run automatically on a recurring basis
            </Typography>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <>
            {/* Pattern */}
            <div className="space-y-1.5">
              <Typography variant="xs" className="font-medium text-muted-foreground uppercase tracking-wide">
                Frequency
              </Typography>
              <Select value={pattern} onValueChange={(v) => setPattern(v as FlowSchedulePattern)}>
                <SelectTrigger size="sm" className="w-full border border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATTERN_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time of day */}
            {showTimeField && (
              <div className="space-y-1.5">
                <Typography variant="xs" className="font-medium text-muted-foreground uppercase tracking-wide">
                  {pattern === 'hourly' ? 'Minute of hour' : 'Time of day'}
                </Typography>
                {pattern === 'hourly' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">:</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={parseInt(time.split(':')[1] ?? '0')}
                      onChange={(e) => setTime(`00:${e.target.value.padStart(2, '0')}`)}
                      className="h-8 w-20 text-sm"
                    />
                  </div>
                ) : (
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-8 text-sm"
                  />
                )}
              </div>
            )}

            {/* Days of week (weekly only) */}
            {pattern === 'weekly' && (
              <div className="space-y-1.5">
                <Typography variant="xs" className="font-medium text-muted-foreground uppercase tracking-wide">
                  Days
                </Typography>
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      onClick={() => toggleDay(day.value)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        daysOfWeek.includes(day.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Day of month (monthly only) */}
            {pattern === 'monthly' && (
              <div className="space-y-1.5">
                <Typography variant="xs" className="font-medium text-muted-foreground uppercase tracking-wide">
                  Day of month
                </Typography>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                  className="h-8 w-20 text-sm"
                />
              </div>
            )}

            {/* Custom interval */}
            {pattern === 'custom_interval' && (
              <div className="space-y-1.5">
                <Typography variant="xs" className="font-medium text-muted-foreground uppercase tracking-wide">
                  Interval (minutes)
                </Typography>
                <Input
                  type="number"
                  min={1}
                  max={10080}
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 60)}
                  className="h-8 w-24 text-sm"
                />
              </div>
            )}

            {/* Timezone */}
            <div className="space-y-1.5">
              <Typography variant="xs" className="font-medium text-muted-foreground uppercase tracking-wide">
                Timezone
              </Typography>
              <Input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. America/New_York"
                className="h-8 text-sm"
              />
            </div>

            {/* End date */}
            <div className="space-y-1.5">
              <Typography variant="xs" className="font-medium text-muted-foreground uppercase tracking-wide">
                End date (optional)
              </Typography>
              <Input
                type="datetime-local"
                value={endDate ? endDate.slice(0, 16) : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="h-8 text-sm"
              />
            </div>

            {/* Summary */}
            <div className="rounded-md bg-muted/50 p-2.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <Typography variant="xs" className="font-medium text-foreground">
                  {describePattern(pattern, time, daysOfWeek, dayOfMonth, intervalMinutes)}
                </Typography>
              </div>
              {flow.schedule_next_run && (
                <Typography variant="xs" className="text-muted-foreground">
                  Next run: {formatNextRun(flow.schedule_next_run)}
                </Typography>
              )}
              {flow.schedule_last_triggered && (
                <Typography variant="xs" className="text-muted-foreground">
                  Last triggered: {new Date(flow.schedule_last_triggered).toLocaleString()}
                </Typography>
              )}
            </div>
          </>
        )}

        {/* Save button */}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full gap-1.5"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Saved
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5" />
              Save schedule
            </>
          )}
        </Button>

        {!enabled && flow.schedule_enabled && (
          <Typography variant="xs" className="text-amber-500 text-center">
            Saving will disable the current schedule
          </Typography>
        )}
      </div>
    </div>
  )
}
