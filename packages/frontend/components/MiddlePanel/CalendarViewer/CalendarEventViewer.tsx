import { ArrowLeft, Clock, MapPin, Users, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '../../ui/button'
import { CalendarEvent } from '../../../../backend/calendarService'

interface CalendarEventViewerProps {
  event: CalendarEvent | null
  onBack?: () => void
  onOpenInGoogle?: (event: CalendarEvent) => void
}

export function CalendarEventViewer({ event, onBack, onOpenInGoogle }: CalendarEventViewerProps) {
  const title = event?.summary || '(No title)'
  const description = event?.description || ''
  const when = useMemo(() => {
    const fmt = (dt?: { date?: string; dateTime?: string }) => {
      if (!dt) return '—'
      const str = dt.dateTime || dt.date
      if (!str) return '—'
      const d = new Date(str)
      return isNaN(d.getTime()) ? str : d.toLocaleString()
    }
    return `${fmt(event?.start)} → ${fmt(event?.end)}`
  }, [event?.start, event?.end])

  if (!event) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 bg-white">
        Select an event to view
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 rounded-md transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-black text-lg font-semibold truncate">{title}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
              <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {when}</div>
              {event.location && (
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {event.htmlLink && (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 rounded-md transition-colors duration-200"
              onClick={() => onOpenInGoogle ? onOpenInGoogle(event) : window.open(event.htmlLink as string, '_blank')}
              title="Open in Google Calendar"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500">
        <div className="w-full">
          <div className="px-6 py-4 border-b border-zinc-800/30 bg-white">
            {event.attendees && event.attendees.length > 0 && (
              <div className="text-sm text-slate-700 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                {event.attendees.map(a => a.email || a.displayName).filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          <div className="p-6 text-gray-900 leading-relaxed whitespace-pre-wrap">
            {description || 'No description'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarEventViewer


