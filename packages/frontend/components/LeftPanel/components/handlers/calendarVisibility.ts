/**
 * Calendar visibility store - persists enabled calendar IDs in localStorage
 * and emits window events for cross-component synchronization.
 */

const STORAGE_KEY = 'banbury-visible-calendar-ids'
const VISIBILITY_EVENT = 'banbury-calendars-visibility-changed'

export function getVisibleCalendarIds(): string[] {
  if (typeof window === 'undefined') return ['primary']
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return ['primary']
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return ['primary']
  } catch {
    return ['primary']
  }
}

export function setVisibleCalendarIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  const validIds = ids.filter(id => typeof id === 'string' && id.length > 0)
  if (validIds.length === 0) validIds.push('primary')
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validIds))
  window.dispatchEvent(new CustomEvent(VISIBILITY_EVENT, { detail: validIds }))
}

export function toggleCalendarVisibility(calendarId: string): void {
  const current = getVisibleCalendarIds()
  const isVisible = current.includes(calendarId)
  if (isVisible) {
    if (current.length > 1) {
      setVisibleCalendarIds(current.filter(id => id !== calendarId))
    }
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

