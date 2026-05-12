import { useEffect, useMemo, useRef, useState } from 'react'
import { Save, Trash2, X, Edit3, ArrowLeft } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Input } from '../../common/ui/old-input'
import { CalendarEvent } from '../../../../backend/api/calendar/calendar'
import { FormattedText } from '../../../utils/textFormatter'
import { ApiService } from 'backend/api/apiService'

interface EditEventPopoverProps {
  isOpen: boolean
  position: { x: number; y: number } | null
  event: CalendarEvent | null
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
  onBack?: () => void
}

export function EditEventPopover({ isOpen, position, event, onClose, onSaved, onDeleted, onBack }: EditEventPopoverProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({})
  const [isAllDay, setIsAllDay] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [attendees, setAttendees] = useState<string[]>([])
  const [newAttendee, setNewAttendee] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const descRef = useRef<HTMLTextAreaElement | null>(null)
  const [measuredWidth, setMeasuredWidth] = useState<number>(380)
  const [measuredHeight, setMeasuredHeight] = useState<number>(360)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const obs = new ResizeObserver(() => {
      setMeasuredWidth(el.offsetWidth)
      setMeasuredHeight(el.offsetHeight)
    })
    obs.observe(el)
    setMeasuredWidth(el.offsetWidth)
    setMeasuredHeight(el.offsetHeight)
    return () => obs.disconnect()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const el = descRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [isOpen, formData.description])

  const clampedPosition = useMemo(() => {
    if (!position) return { x: 0, y: 0 }
    if (typeof window === 'undefined') return position
    const margin = 8
    const maxX = window.innerWidth - measuredWidth - margin
    const maxY = window.innerHeight - measuredHeight - margin
    const x = Math.min(Math.max(margin, position.x), Math.max(margin, maxX))
    const y = Math.min(Math.max(margin, position.y), Math.max(margin, maxY))
    return { x, y }
  }, [position, measuredWidth, measuredHeight])

  const popoverMaxHeight = useMemo(() => {
    if (typeof window === 'undefined') return undefined

    const margin = 8
    return Math.max(240, window.innerHeight - clampedPosition.y - margin)
  }, [clampedPosition.y])

  useEffect(() => {
    if (!isOpen || !event) return
    setFormData({
      summary: event.summary || '',
      description: event.description || '',
      location: event.location || '',
      start: event.start || {},
      end: event.end || {}
    })
    setIsAllDay(!!event.start?.date)
    setAttendees(event.attendees?.map(a => a.email || a.displayName || '') || [])
    setNewAttendee('')
    setIsEditingDescription(false)
  }, [isOpen, event])

  useEffect(() => {
    if (!isOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        e.stopPropagation()
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('mousedown', onDocClick, true)
    return () => document.removeEventListener('mousedown', onDocClick, true)
  }, [isOpen, onClose])

  if (!isOpen || !event || !position) return null

  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }))
  const formatDate = (date?: string) => (date ? date : '')
  const formatDateTime = (dateTime?: string) => (dateTime ? dateTime.slice(0, 16) : '')
  const inputClassName = 'bg-card text-foreground placeholder:text-muted-foreground dark:bg-card'

  const handleAddAttendee = () => {
    if (newAttendee.trim() && !attendees.includes(newAttendee.trim())) {
      setAttendees([...attendees, newAttendee.trim()])
      setNewAttendee('')
    }
  }

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index))
  }

  const handleDateTimeChange = (type: 'start' | 'end', field: 'date' | 'dateTime', value: string) => {
    setFormData(prev => {
      const current = prev[type] || {}
      if (field === 'date') {
        const time = current.dateTime ? current.dateTime.slice(11) : '00:00:00'
        const dateTime = value ? `${value}T${time}` : undefined
        return { ...prev, [type]: { ...current, date: value, dateTime } }
      }
      if (field === 'dateTime') {
        const date = current.date || (current.dateTime ? current.dateTime.slice(0, 10) : '')
        const dateTime = date ? `${date}T${value}:00` : undefined
        return { ...prev, [type]: { ...current, dateTime } }
      }
      return prev
    })
  }

  const handleSave = async () => {
    if (!event) return
    if (!formData.summary?.trim()) {
      alert('Please enter an event title')
      return
    }
    const eventData: Partial<CalendarEvent> = {
      summary: formData.summary.trim(),
      description: formData.description?.trim() || undefined,
      location: formData.location?.trim() || undefined,
      attendees: attendees.length > 0 ? attendees.map(email => ({ email })) : undefined,
    }
    if (isAllDay) {
      if (!formData.start?.date) {
        alert('Please enter a start date for the all-day event')
        return
      }
      eventData.start = { date: formData.start.date }
      eventData.end = { date: formData.end?.date || formData.start.date }
    } else {
      if (!formData.start?.dateTime) {
        alert('Please enter a start date and time')
        return
      }
      const startDate = new Date(formData.start.dateTime)
      if (isNaN(startDate.getTime())) {
        alert('Please enter a valid start date and time')
        return
      }
      let endDate: Date
      if (formData.end?.dateTime) {
        endDate = new Date(formData.end.dateTime)
        if (isNaN(endDate.getTime())) {
          alert('Please enter a valid end date and time')
          return
        }
      } else {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
      }
      eventData.start = { dateTime: startDate.toISOString() }
      eventData.end = { dateTime: endDate.toISOString() }
    }

    setLoading(true)
    try {
      await ApiService.Calendar.updateEvent(event.id, eventData, event.calendarId ?? 'primary')
      onSaved()
      onClose()
    } catch (e) {
      console.error('Error saving event', e)
      alert('Failed to save event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !confirm('Are you sure you want to delete this event?')) return
    setDeleting(true)
    try {
      await ApiService.Calendar.deleteEvent(event.id, event.calendarId ?? 'primary')
      onDeleted()
      onClose()
    } catch (e) {
      console.error('Error deleting event', e)
      alert('Failed to delete event. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-[520px] max-w-[90vw] overflow-y-auto rounded-lg border border-border bg-popover shadow-xl"
      style={{ left: clampedPosition.x, top: clampedPosition.y, maxHeight: popoverMaxHeight }}
    >
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={onBack}
              title="Back to details"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          )}
          <div>
            <div className="text-sm font-semibold text-foreground">Edit event</div>
            <div className="text-xs text-muted-foreground">Update details, guests, and timing</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-4 p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Title</span>
            <Input
              type="text"
              value={formData.summary || ''}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              variant="outline"
              inputSize="sm"
              placeholder="Event title"
              className={inputClassName}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Location</span>
            <Input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              variant="outline"
              inputSize="sm"
              placeholder="Location"
              className={inputClassName}
            />
          </label>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Description</span>
          <div className="relative">
          {!isEditingDescription ? (
            <div className="min-h-[3rem] w-full rounded border border-border bg-card px-2 py-1.5 pr-9 text-sm text-foreground dark:bg-card">
              {formData.description ? (
                <FormattedText 
                  text={formData.description} 
                  className="text-sm text-foreground leading-relaxed"
                />
              ) : (
                <span className="text-muted-foreground">No description</span>
              )}
            </div>
          ) : (
            <textarea
              ref={descRef}
              value={formData.description || ''}
              onChange={(e) => {
                e.currentTarget.style.height = 'auto'
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
                handleInputChange('description', e.target.value)
              }}
              rows={2}
              className="w-full resize-none overflow-hidden rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-card"
              placeholder="Description"
            />
          )}
          <Button
            type="button"
            onClick={() => setIsEditingDescription(!isEditingDescription)}
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Guests</span>
            <div className="flex gap-1 flex-1">
              <Input
                type="email"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAttendee()}
                variant="outline"
                inputSize="sm"
                placeholder="Email"
                className={`flex-1 text-xs ${inputClassName}`}
              />
              <Button
                type="button"
                onClick={handleAddAttendee}
                disabled={!newAttendee.trim()}
                variant="default"
                size="sm"
                className="text-xs"
              >
                +
              </Button>
            </div>
          </div>
          {attendees.length > 0 && (
            <div className="max-h-28 space-y-1 overflow-y-auto rounded border border-border bg-card p-1 dark:bg-card">
              {attendees.map((attendee, index) => (
                <div key={index} className="flex items-center justify-between rounded px-1 py-0.5">
                  <span className="text-xs text-foreground truncate">{attendee}</span>
                  <Button
                    type="button"
                    onClick={() => handleRemoveAttendee(index)}
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive text-xs"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 rounded border border-border bg-card px-2 py-1.5 dark:bg-card">
          <input
            type="checkbox"
            id="edit-popover-allDay"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="w-3 h-3 text-primary bg-background border-border rounded focus:ring-ring"
          />
          <label htmlFor="edit-popover-allDay" className="text-xs font-medium text-muted-foreground">All-day event</label>
        </div>
        {isAllDay ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Start date</span>
              <Input type="date" value={formData.start?.date || formatDate(formData.start?.dateTime)} onChange={(e) => handleDateTimeChange('start', 'date', e.target.value)} variant="outline" inputSize="sm" className={`text-xs ${inputClassName}`} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">End date</span>
              <Input type="date" value={formData.end?.date || formatDate(formData.end?.dateTime)} onChange={(e) => handleDateTimeChange('end', 'date', e.target.value)} variant="outline" inputSize="sm" className={`text-xs ${inputClassName}`} />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Start date</span>
              <Input type="date" value={formData.start?.date || formatDate(formData.start?.dateTime)} onChange={(e) => handleDateTimeChange('start', 'date', e.target.value)} variant="outline" inputSize="sm" className={`text-xs ${inputClassName}`} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Start time</span>
              <Input type="time" value={formData.start?.dateTime ? formatDateTime(formData.start.dateTime).slice(11) : ''} onChange={(e) => handleDateTimeChange('start', 'dateTime', e.target.value)} variant="outline" inputSize="sm" className={`text-xs ${inputClassName}`} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">End date</span>
              <Input type="date" value={formData.end?.date || formatDate(formData.end?.dateTime)} onChange={(e) => handleDateTimeChange('end', 'date', e.target.value)} variant="outline" inputSize="sm" className={`text-xs ${inputClassName}`} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">End time</span>
              <Input type="time" value={formData.end?.dateTime ? formatDateTime(formData.end.dateTime).slice(11) : ''} onChange={(e) => handleDateTimeChange('end', 'dateTime', e.target.value)} variant="outline" inputSize="sm" className={`text-xs ${inputClassName}`} />
            </label>
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <Button onClick={handleSave} disabled={loading} variant="default" className="flex-1 text-xs">
          <Save className="h-3 w-3 mr-1" /> {loading ? 'Saving...' : 'Save'}
        </Button>
        <Button onClick={handleDelete} disabled={deleting} variant="destructive" className="flex-1 text-xs">
          <Trash2 className="h-3 w-3 mr-1" /> {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  )
}

export default EditEventPopover


