import type { NextRouter } from 'next/router'
import { trackPageView } from '@/services/trackingService'

export function attachRouteTracking(router: NextRouter) {
  if (!router || typeof window === 'undefined') return

  const handleRoute = (url: string) => {
    try {
      const { hash } = window.location
      const fullPath = `${url}${hash || ''}`
      trackPageView(fullPath)
    } catch {
      /* ignore tracking errors */
    }
  }

  // Track initial load
  handleRoute(router.asPath)

  // Track on route changes
  router.events.on('routeChangeComplete', handleRoute)

  // Return a cleanup function for callers that need to detach
  return () => {
    router.events.off('routeChangeComplete', handleRoute)
  }
}


