/**
 * Calendar provider management - persists selected provider in localStorage
 * and emits window events for cross-component synchronization.
 */

export type CalendarProvider = 'google' | 'microsoft'

const STORAGE_KEY = 'banbury-calendar-provider'
const PROVIDER_EVENT = 'banbury-calendar-provider-changed'

export function getSelectedProvider(): CalendarProvider {
  if (typeof window === 'undefined') return 'google'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'microsoft') return 'microsoft'
    return 'google'
  } catch {
    return 'google'
  }
}

export function setSelectedProvider(provider: CalendarProvider): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, provider)
  window.dispatchEvent(new CustomEvent(PROVIDER_EVENT, { detail: provider }))
}

export function subscribeToProviderChanges(callback: (provider: CalendarProvider) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<CalendarProvider>
    callback(customEvent.detail)
  }
  window.addEventListener(PROVIDER_EVENT, handler)
  return () => window.removeEventListener(PROVIDER_EVENT, handler)
}

