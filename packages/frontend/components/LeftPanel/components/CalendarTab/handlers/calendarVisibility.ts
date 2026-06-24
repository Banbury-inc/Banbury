/**
 * Calendar visibility store - persists enabled calendar IDs in localStorage
 * and emits window events for cross-component synchronization.
 */

const STORAGE_KEY = 'banbury-visible-calendar-ids'
const VISIBILITY_EVENT = 'banbury-calendars-visibility-changed'

function getStoredVisibleCalendarIds(): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) return parsed.filter(id => typeof id === 'string' && id.length > 0)
    return null
  } catch {
    return null
  }
}

export function getVisibleCalendarIds(): string[] {
  return getStoredVisibleCalendarIds() || []
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

export function initializeVisibleCalendarIds(calendarIds: string[]): string[] {
  const validCalendarIds = calendarIds.filter(id => typeof id === 'string' && id.length > 0)
  const storedIds = getStoredVisibleCalendarIds()

  if (storedIds === null) {
    setVisibleCalendarIds(validCalendarIds)
    return validCalendarIds
  }

  const hasVisibleCalendar = storedIds.some(id => validCalendarIds.includes(id))
  if (storedIds.length > 0 && !hasVisibleCalendar) {
    setVisibleCalendarIds(validCalendarIds)
    return validCalendarIds
  }

  return storedIds
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

