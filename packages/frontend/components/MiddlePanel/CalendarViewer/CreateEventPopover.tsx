import { useEffect, useMemo, useRef, useState } from 'react'
import { Save, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { CalendarEvent } from '../../../../backend/api/calendar/calendar'
import { ApiService } from 'backend/api/apiService'

interface CreateEventPopoverProps {
  isOpen: boolean
  position: { x: number; y: number } | null
  selectedDate: Date | null
  onClose: () => void
  onCreated: () => void
}

export function CreateEventPopover({ isOpen, position, selectedDate, onClose, onCreated }: CreateEventPopoverProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({})
  const [isAllDay, setIsAllDay] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attendees, setAttendees] = useState<string[]>([])
  const [newAttendee, setNewAttendee] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const descRef = useRef<HTMLTextAreaElement | null>(null)
  const [measuredWidth, setMeasuredWidth] = useState<number>(360)
  const [measuredHeight, setMeasuredHeight] = useState<number>(320)

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

  useEffect(() => {
    if (!isOpen || !selectedDate) return
    const start = new Date(selectedDate)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + 60)
    const pad = (n: number) => String(n).padStart(2, '0')
    const toLocalInput = (d: Date) => {
      const yyyy = d.getFullYear()
      const mm = pad(d.getMonth() + 1)
      const dd = pad(d.getDate())
      const hh = pad(d.getHours())
      const mi = pad(d.getMinutes())
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`
    }
    const toDateInput = (d: Date) => toLocalInput(d).slice(0, 10)
    setFormData({
      summary: '',
      description: '',
      location: '',
      start: { date: toDateInput(start), dateTime: toLocalInput(start) },
      end: { date: toDateInput(end), dateTime: toLocalInput(end) }
    })
    setIsAllDay(false)
    setAttendees([])
    setNewAttendee('')
  }, [isOpen, selectedDate])

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

  if (!isOpen || !position) return null

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatDate = (date?: string) => (date ? date : '')
  const formatDateTime = (dateTime?: string) => (dateTime ? dateTime.slice(0, 16) : '')

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

  const handleAddAttendee = () => {
    if (newAttendee.trim() && !attendees.includes(newAttendee.trim())) {
      setAttendees([...attendees, newAttendee.trim()])
      setNewAttendee('')
    }
  }

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
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
      await ApiService.Calendar.createEvent(eventData)
      onCreated()
      onClose()
    } catch (e) {
      console.error('Error creating event', e)
      alert('Failed to create event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div
        ref={containerRef}
        className="fixed z-50 w-[500px] max-w-[90vw] bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl"
        style={{ left: clampedPosition.x, top: clampedPosition.y }}
      >
      <div className="flex items-center justify-between p-2 border-b border-zinc-700">
        <div className="text-sm font-medium text-white">New Event</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="p-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={formData.summary || ''}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            className="w-full px-2 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Event title"
          />
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-2 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Location"
          />
        </div>
        <textarea
          ref={descRef}
          value={formData.description || ''}
          onChange={(e) => {
            // auto-resize then update state
            e.currentTarget.style.height = 'auto'
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
            handleInputChange('description', e.target.value)
          }}
          rows={2}
          className="w-full px-2 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden"
          placeholder="Description"
        />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-300">Guests</span>
            <div className="flex gap-1 flex-1">
              <input
                type="email"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAttendee()}
                className="flex-1 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Email"
              />
              <Button
                type="button"
                onClick={handleAddAttendee}
                disabled={!newAttendee.trim()}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-xs"
              >
                +
              </Button>
            </div>
          </div>
          {attendees.length > 0 && (
            <div className="space-y-0.5 max-h-20 overflow-y-auto">
              {attendees.map((attendee, index) => (
                <div key={index} className="flex items-center justify-between p-1 bg-zinc-700 rounded border border-zinc-600">
                  <span className="text-xs text-white truncate">{attendee}</span>
                  <Button
                    type="button"
                    onClick={() => handleRemoveAttendee(index)}
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="popover-allDay"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="w-3 h-3 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="popover-allDay" className="text-xs font-medium text-slate-300">All-day event</label>
        </div>

        {isAllDay ? (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={formData.start?.date || formatDate(formData.start?.dateTime)}
              onChange={(e) => handleDateTimeChange('start', 'date', e.target.value)}
              className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="date"
              value={formData.end?.date || formatDate(formData.end?.dateTime)}
              onChange={(e) => handleDateTimeChange('end', 'date', e.target.value)}
              className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <input
              type="date"
              value={formData.start?.date || formatDate(formData.start?.dateTime)}
              onChange={(e) => handleDateTimeChange('start', 'date', e.target.value)}
              className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="time"
              value={formData.start?.dateTime ? formatDateTime(formData.start.dateTime).slice(11) : ''}
              onChange={(e) => handleDateTimeChange('start', 'dateTime', e.target.value)}
              className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="date"
              value={formData.end?.date || formatDate(formData.end?.dateTime)}
              onChange={(e) => handleDateTimeChange('end', 'date', e.target.value)}
              className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="time"
              value={formData.end?.dateTime ? formatDateTime(formData.end.dateTime).slice(11) : ''}
              onChange={(e) => handleDateTimeChange('end', 'dateTime', e.target.value)}
              className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-white hover:bg-zinc-200 text-black text-xs py-1">
            <Save className="h-3 w-3 mr-1" />
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" className="flex-1 text-xs py-1 text-white" onClick={onClose}>Cancel</Button>
        </div>
      </div>
      </div>
  )
}

export default CreateEventPopover


