/**
 * Calendar visibility store - persists enabled calendar IDs in localStorage
 * and emits window events for cross-component synchronization.
 */

const STORAGE_KEY = 'banbury-visible-calendar-ids'
const VISIBILITY_EVENT = 'banbury-calendars-visibility-changed'

export function getVisibleCalendarIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

export function setVisibleCalendarIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  const validIds = ids.filter(id => typeof id === 'string' && id.length > 0)
  // Allow empty array - user can have zero visible calendars
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validIds))
  window.dispatchEvent(new CustomEvent(VISIBILITY_EVENT, { detail: validIds }))
}

export function toggleCalendarVisibility(calendarId: string): void {
  const current = getVisibleCalendarIds()
  const isVisible = current.includes(calendarId)
  if (isVisible) {
    // Allow removing all calendars - user can have zero visible calendars
    setVisibleCalendarIds(current.filter(id => id !== calendarId))
  } else {
    setVisibleCalendarIds([...current, calendarId])
  }
}

export function subscribeToVisibilityChanges(callback: (ids: string[]) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<string[]>
    callback(customEvent.detail)
  }
  window.addEventListener(VISIBILITY_EVENT, handler)
  return () => window.removeEventListener(VISIBILITY_EVENT, handler)
}

