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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/b014ea10-a539-4e5f-9832-890e328944bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'calendarVisibility.ts:toggleCalendarVisibility:entry',message:'Toggle called',data:{calendarId,calendarIdType:typeof calendarId,calendarIdLength:calendarId.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H5'})}).catch(()=>{});
  // #endregion
  const current = getVisibleCalendarIds()
  const isVisible = current.includes(calendarId)
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/b014ea10-a539-4e5f-9832-890e328944bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'calendarVisibility.ts:toggleCalendarVisibility:state',message:'Current visibility state',data:{current,isVisible,willBe:isVisible?current.filter(id=>id!==calendarId):[...current,calendarId]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
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

