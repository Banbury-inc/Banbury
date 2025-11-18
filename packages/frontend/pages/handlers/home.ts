export interface OpenUrlArgs {
  url: string
  target?: '_self' | '_blank'
}

export function handleOpenUrl({ url, target }: OpenUrlArgs): void {
  if (!url) return
  if (target === '_self') {
    window.location.href = url
    return
  }
  window.open(url, '_blank')
}

import type React from 'react'
import type { MotionValue } from 'framer-motion'

export interface MouseSpotlightArgs {
  e: React.MouseEvent<HTMLElement>
  element: HTMLElement | null
}

export function handleMouseSpotlight({ e, element }: MouseSpotlightArgs): void {
  if (!element) return
  const rect = element.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  element.style.setProperty('--mx', `${x}px`)
  element.style.setProperty('--my', `${y}px`)
}

export interface UpdateTiltFromMouseArgs {
  e: React.MouseEvent<HTMLElement>
  element: HTMLElement | null
  rotateX: MotionValue<number>
  rotateY: MotionValue<number>
  maxRotateX?: number
  maxRotateY?: number
}

export function updateTiltFromMouse({ e, element, rotateX, rotateY, maxRotateX = 6, maxRotateY = 12 }: UpdateTiltFromMouseArgs): void {
  if (!element) return
  const rect = element.getBoundingClientRect()
  const relX = (e.clientX - rect.left) / rect.width
  const relY = (e.clientY - rect.top) / rect.height
  const yFromCenter = (relY - 0.5) * 2
  const xFromCenter = (relX - 0.5) * 2
  rotateX.set(-yFromCenter * maxRotateX)
  rotateY.set(xFromCenter * maxRotateY)
}

export interface ResetTiltArgs {
  rotateX: MotionValue<number>
  rotateY: MotionValue<number>
}

export function resetTilt({ rotateX, rotateY }: ResetTiltArgs): void {
  rotateX.set(0)
  rotateY.set(0)
}

export interface HandleDownloadArgs {
  url: string
}

export function handleDownload({ url }: HandleDownloadArgs): void {
  if (!url) return
  window.open(url, '_blank')
}


