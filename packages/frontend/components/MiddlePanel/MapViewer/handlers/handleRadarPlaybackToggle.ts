import type { MutableRefObject } from 'react'
import type mapboxgl from 'mapbox-gl'

import type { RainViewerRadarFrame } from './fetchRainViewerRadarTileUrl'
import { preloadRainViewerRadarFrames } from './preloadRainViewerRadarFrames'

export interface HandleRadarPlaybackToggleParams {
  mapRef: MutableRefObject<mapboxgl.Map | null>
  /** Intended next playing state (true = play after optional preload). */
  nextPlaying: boolean
  rainViewerHost: string
  rainViewerTimeline: RainViewerRadarFrame[]
  rainViewerTileSize: 256 | 512
  preloadAbortRef: MutableRefObject<AbortController | null>
  setIsRainViewerPlaying: (value: boolean) => void
  setIsRadarPlaybackPreloading: (value: boolean) => void
}

export async function handleRadarPlaybackToggle(params: HandleRadarPlaybackToggleParams): Promise<void> {
  const {
    mapRef,
    nextPlaying,
    rainViewerHost,
    rainViewerTimeline,
    rainViewerTileSize,
    preloadAbortRef,
    setIsRainViewerPlaying,
    setIsRadarPlaybackPreloading,
  } = params

  if (!nextPlaying) {
    preloadAbortRef.current?.abort()
    preloadAbortRef.current = null
    setIsRadarPlaybackPreloading(false)
    setIsRainViewerPlaying(false)
    return
  }

  const map = mapRef.current
  if (!map || rainViewerTimeline.length <= 1) return

  preloadAbortRef.current?.abort()
  const controller = new AbortController()
  preloadAbortRef.current = controller

  try {
    setIsRadarPlaybackPreloading(true)
    const c = map.getCenter()
    const z = map.getZoom()
    await preloadRainViewerRadarFrames({
      host: rainViewerHost,
      timeline: rainViewerTimeline,
      tileSize: rainViewerTileSize,
      center: { lng: c.lng, lat: c.lat },
      zoom: z,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
  } finally {
    setIsRadarPlaybackPreloading(false)
  }

  if (controller.signal.aborted) return
  setIsRainViewerPlaying(true)
}
