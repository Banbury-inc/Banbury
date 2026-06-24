export type PanelDropZone = 'left' | 'right' | 'top' | 'bottom'

export interface Point {
  x: number
  y: number
}

function getEdgeThreshold(rect: DOMRect) {
  return Math.min(140, Math.min(rect.width, rect.height) * 0.25)
}

export function getPanelDropZoneFromElement(element: HTMLElement, point: Point): PanelDropZone | null {
  const rect = element.getBoundingClientRect()
  const relativeX = Math.max(0, Math.min(point.x - rect.left, rect.width))
  const relativeY = Math.max(0, Math.min(point.y - rect.top, rect.height))
  const distances = {
    left: relativeX,
    right: rect.width - relativeX,
    top: relativeY,
    bottom: rect.height - relativeY,
  }

  const closestZone = Object.entries(distances).reduce<PanelDropZone>((closest, [zone, distance]) => {
    return distance < distances[closest] ? (zone as PanelDropZone) : closest
  }, 'left')

  return distances[closestZone] <= getEdgeThreshold(rect) ? closestZone : null
}

export function findPanelElementById(panelId: string) {
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-panel-id]'))
  return panels.find((element) => element.getAttribute('data-panel-id') === panelId) ?? null
}

export function getPanelDropZone(panelId: string, point: Point | null) {
  if (!point) return null

  const panel = findPanelElementById(panelId)
  if (!panel) return null

  return getPanelDropZoneFromElement(panel, point)
}
