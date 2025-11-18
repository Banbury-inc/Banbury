import { useState, useEffect } from 'react'
import { X, Edit, Trash2, Plus, Save, Calendar, Clock, MapPin, User, Users } from 'lucide-react'
import { Button } from './ui/button'
import { CalendarService, CalendarEvent } from '../services/calendarService'

interface EventModalProps {
  event?: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onEventSaved: () => void
  onEventDeleted: () => void
  selectedDate?: Date | null
}

export function EventModal({ 
  event, 
  isOpen, 
  onClose, 
  onEventSaved, 
  onEventDeleted, 
  selectedDate 
}: EventModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({})
  const [loading, setLoading] = useState(false)
  const [isAllDay, setIsAllDay] = useState(false)

  const isNewEvent = !event && selectedDate !== null && selectedDate !== undefined

  useEffect(() => {
    if (isOpen) {
      if (isNewEvent) {
        setIsCreating(true)
        setIsEditing(false)
        // Initialize with selected date
        const start = new Date(selectedDate!)
        const end = new Date(start)
        end.setMinutes(end.getMinutes() + 60)
        const toLocalInput = (d: Date) => {
          const pad = (n: number) => String(n).padStart(2, '0')
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
      } else if (event) {
        setIsCreating(false)
        setIsEditing(false)
        setFormData({
          summary: event.summary || '',
          description: event.description || '',
          location: event.location || '',
          start: event.start || {},
          end: event.end || {}
        })
        setIsAllDay(!!event.start?.date) // Check if it's an all-day event
      }
    }
  }, [isOpen, event, isNewEvent, selectedDate])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateTimeChange = (type: 'start' | 'end', field: 'date' | 'dateTime', value: string) => {
    setFormData(prev => {
      const current = prev[type] || {}
      
      if (field === 'date') {
        // If we have a time, combine it with the new date
        const time = current.dateTime ? current.dateTime.slice(11) : '00:00:00'
        const dateTime = value ? `${value}T${time}` : undefined
        
        return {
          ...prev,
          [type]: {
            ...current,
            date: value,
            dateTime: dateTime
          }
        }
      } else if (field === 'dateTime') {
        // If we have a date, combine it with the new time
        const date = current.date || formatDate(current.dateTime)
        const dateTime = date ? `${date}T${value}:00` : undefined
        
        return {
          ...prev,
          [type]: {
            ...current,
            dateTime: dateTime
          }
        }
      }
      
      return prev
    })
  }

  const handleSave = async () => {
    if (!formData.summary?.trim()) {
      alert('Please enter an event title')
      return
    }

    // Prepare the event data with proper formatting
    const eventData: Partial<CalendarEvent> = {
      summary: formData.summary.trim(),
      description: formData.description?.trim() || undefined,
      location: formData.location?.trim() || undefined,
    }

    // Handle start date/time
    if (isAllDay) {
      // All-day event
      if (!formData.start?.date) {
        alert('Please enter a start date for the all-day event')
        return
      }
      eventData.start = { date: formData.start.date }
    } else {
      // Timed event
      if (!formData.start?.dateTime) {
        alert('Please enter a start date and time')
        return
      }
      const startDate = new Date(formData.start.dateTime)
      if (isNaN(startDate.getTime())) {
        alert('Please enter a valid start date and time')
        return
      }
      eventData.start = { dateTime: startDate.toISOString() }
    }

    // Handle end date/time
    if (isAllDay) {
      // All-day event
      if (!formData.end?.date) {
        // If no end date specified, use the same as start date
        eventData.end = { date: formData.start?.date }
      } else {
        eventData.end = { date: formData.end.date }
      }
    } else {
      // Timed event
      if (formData.end?.dateTime) {
        const endDate = new Date(formData.end.dateTime)
        if (isNaN(endDate.getTime())) {
          alert('Please enter a valid end date and time')
          return
        }
        eventData.end = { dateTime: endDate.toISOString() }
      } else {
        // If no end time specified, set end time to 1 hour later
        const startDate = new Date(eventData.start.dateTime!)
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour later
        eventData.end = { dateTime: endDate.toISOString() }
      }
    }

    setLoading(true)
    try {
      if (isCreating) {
        await CalendarService.createEvent(eventData)
      } else if (event) {
        await CalendarService.updateEvent(event.id, eventData)
      }
      onEventSaved()
      onClose()
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Failed to save event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !confirm('Are you sure you want to delete this event?')) {
      return
    }

    setIsDeleting(true)
    try {
      await CalendarService.deleteEvent(event.id)
      onEventDeleted()
      onClose()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return ''
    return dateTime.slice(0, 16) // YYYY-MM-DDTHH:MM format
  }

  const formatDate = (date?: string) => {
    if (!date) return ''
    return date
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-zinc-800 rounded-lg shadow-xl max-w-md w-full mx-4 my-8">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-white">
            {isCreating ? 'New Event' : isEditing ? 'Edit Event' : 'Event Details'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {!isEditing && !isCreating && event && (
            // View mode
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">{event.summary || '(No title)'}</h3>
                {event.description && (
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{event.description}</p>
                )}
              </div>

              <div className="space-y-3">
                {event.start && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">
                      {event.start.dateTime 
                        ? new Date(event.start.dateTime).toLocaleString()
                        : event.start.date
                      }
                    </span>
                  </div>
                )}

                {event.end && event.start && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">
                      {event.end.dateTime 
                        ? new Date(event.end.dateTime).toLocaleString()
                        : event.end.date
                      }
                    </span>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                )}

                {event.creator && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{event.creator.displayName || event.creator.email}</span>
                  </div>
                )}

                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-start gap-2 text-slate-300">
                    <Users className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium mb-1">Attendees:</div>
                      {event.attendees.map((attendee, idx) => (
                        <div key={idx} className="text-xs">
                          {attendee.displayName || attendee.email}
                          {attendee.responseStatus && (
                            <span className="ml-2 text-slate-400">({attendee.responseStatus})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          )}

          {(isEditing || isCreating) && (
            // Edit/Create mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.summary || ''}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event location"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="allDay" className="text-sm font-medium text-slate-300">
                  All-day event
                </label>
              </div>

                            {isAllDay ? (
                // All-day event inputs
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start?.date || formatDate(formData.start?.dateTime)}
                      onChange={(e) => handleDateTimeChange('start', 'date', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.end?.date || formatDate(formData.end?.dateTime)}
                      onChange={(e) => handleDateTimeChange('end', 'date', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                // Timed event inputs
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.start?.date || formatDate(formData.start?.dateTime)}
                        onChange={(e) => handleDateTimeChange('start', 'date', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.start?.dateTime ? formatDateTime(formData.start.dateTime).slice(11) : ''}
                        onChange={(e) => handleDateTimeChange('start', 'dateTime', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.end?.date || formatDate(formData.end?.dateTime)}
                        onChange={(e) => handleDateTimeChange('end', 'date', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.end?.dateTime ? formatDateTime(formData.end.dateTime).slice(11) : ''}
                        onChange={(e) => handleDateTimeChange('end', 'dateTime', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={() => {
                    if (isCreating) {
                      onClose()
                    } else {
                      setIsEditing(false)
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
