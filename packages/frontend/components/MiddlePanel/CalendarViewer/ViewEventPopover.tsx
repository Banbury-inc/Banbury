import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Clock, Edit3, ExternalLink, MapPin, Trash2, Users, X } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { CalendarEvent } from '../../../../backend/api/calendar/calendar'
import { FormattedText } from '../../../utils/textFormatter'
import { deleteCalendarEvent } from './handlers/deleteCalendarEvent'

interface EventCalendarDetails {
  name: string
  color?: string
}

interface ViewEventPopoverProps {
  isOpen: boolean
  position: { x: number; y: number } | null
  event: CalendarEvent | null
  calendarDetails?: EventCalendarDetails
  onClose: () => void
  onEdit: () => void
  onDeleted: () => void
}

export function ViewEventPopover({ isOpen, position, event, calendarDetails, onClose, onEdit, onDeleted }: ViewEventPopoverProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [measuredWidth, setMeasuredWidth] = useState<number>(380)
  const [measuredHeight, setMeasuredHeight] = useState<number>(300)
  const [headerHeight, setHeaderHeight] = useState<number>(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const obs = new ResizeObserver(() => {
      setMeasuredWidth(el.offsetWidth)
      setMeasuredHeight(el.offsetHeight)
      setHeaderHeight(headerRef.current?.offsetHeight || 0)
    })
    obs.observe(el)
    setMeasuredWidth(el.offsetWidth)
    setMeasuredHeight(el.offsetHeight)
    setHeaderHeight(headerRef.current?.offsetHeight || 0)
    return () => obs.disconnect()
  }, [isOpen])

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

  const bodyMaxHeight = useMemo(() => {
    if (typeof window === 'undefined') return undefined

    const margin = 8
    return Math.max(120, window.innerHeight - clampedPosition.y - headerHeight - margin)
  }, [clampedPosition.y, headerHeight])

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

  const formattedTime = useMemo(() => {
    if (!event) return ''
    const fmt = (dt?: { date?: string; dateTime?: string }) => {
      if (!dt) return '—'
      const str = dt.dateTime || dt.date
      if (!str) return '—'
      const d = new Date(str)
      if (isNaN(d.getTime())) return str
      if (dt.date && !dt.dateTime) {
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      }
      return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    }
    return `${fmt(event.start)} → ${fmt(event.end)}`
  }, [event])

  if (!isOpen || !event || !position) return null

  const title = event.summary || '(No title)'
  const description = event.description || ''
  const location = event.location || ''
  const attendees = event.attendees?.map(a => a.email || a.displayName || '').filter(Boolean) || []
  const calendarName = calendarDetails?.name || event.calendarId || 'Calendar'

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-[420px] max-w-[90vw] bg-popover border border-border rounded-lg shadow-xl"
      style={{ left: clampedPosition.x, top: clampedPosition.y }}
    >
      <div ref={headerRef} className="flex items-center justify-between p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground truncate flex-1 pr-2">{title}</h2>
        <div className="flex items-center gap-1">
          {event.htmlLink && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => window.open(event.htmlLink as string, '_blank')}
              title="Open in Calendar"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            title="Edit event"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => deleteCalendarEvent({ event, onDeleted, onClose, setIsDeleting })}
            disabled={isDeleting}
            title="Delete event"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto p-3" style={{ maxHeight: bodyMaxHeight }}>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="flex min-w-0 items-center gap-2 text-foreground">
            {calendarDetails?.color && (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: calendarDetails.color }}
              />
            )}
            <span className="truncate">{calendarName}</span>
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="text-foreground">{formattedTime}</span>
        </div>

        {location && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-foreground">{location}</span>
          </div>
        )}

        {attendees.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-foreground">{attendees.join(', ')}</span>
          </div>
        )}

        {description && (
          <div className="pt-2 border-t border-border">
            <div className="text-sm text-foreground">
              <FormattedText text={description} className="text-sm leading-relaxed" />
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default ViewEventPopover

