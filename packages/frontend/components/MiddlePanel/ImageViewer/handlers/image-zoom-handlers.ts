import type { Dispatch, SetStateAction, WheelEvent } from 'react'

export const DEFAULT_IMAGE_ZOOM = 1
export const MIN_IMAGE_ZOOM = 0.5
export const MAX_IMAGE_ZOOM = 3
export const IMAGE_ZOOM_STEP = 0.25

function clampImageZoom(zoomLevel: number) {
  return Math.min(MAX_IMAGE_ZOOM, Math.max(MIN_IMAGE_ZOOM, Number(zoomLevel.toFixed(2))))
}

export function createImageZoomInHandler(setZoomLevel: Dispatch<SetStateAction<number>>) {
  return function handleImageZoomIn() {
    setZoomLevel((currentZoomLevel) => clampImageZoom(currentZoomLevel + IMAGE_ZOOM_STEP))
  }
}

export function createImageZoomOutHandler(setZoomLevel: Dispatch<SetStateAction<number>>) {
  return function handleImageZoomOut() {
    setZoomLevel((currentZoomLevel) => clampImageZoom(currentZoomLevel - IMAGE_ZOOM_STEP))
  }
}

export function createImageZoomResetHandler(setZoomLevel: Dispatch<SetStateAction<number>>) {
  return function handleImageZoomReset() {
    setZoomLevel(DEFAULT_IMAGE_ZOOM)
  }
}

export function createImageWheelZoomHandler(setZoomLevel: Dispatch<SetStateAction<number>>) {
  return function handleImageWheelZoom(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()

    const zoomDirection = event.deltaY < 0 ? 1 : -1
    setZoomLevel((currentZoomLevel) => (
      clampImageZoom(currentZoomLevel + (IMAGE_ZOOM_STEP * zoomDirection))
    ))
  }
}
