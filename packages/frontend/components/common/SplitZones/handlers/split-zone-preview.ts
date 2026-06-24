export type SplitZoneDropZone = 'left' | 'right' | 'top' | 'bottom'

export interface SplitZonePreview {
  dropZone: SplitZoneDropZone
  panelRect: DOMRect
  previewRect: {
    left: number
    top: number
    width: number
    height: number
  }
  dividerRect: {
    left: number
    top: number
    width: number
    height: number
  }
}

interface GetSplitZonePreviewParams {
  dropTargetPanel: string | null
  dropZone: SplitZoneDropZone | null
  mousePosition: { x: number; y: number } | null
}

function findPanelElement(panelId: string | null, mousePosition: { x: number; y: number } | null) {
  if (panelId) {
    const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-panel-id]'))
    const panel = panels.find((element) => element.getAttribute('data-panel-id') === panelId)
    if (panel) return panel
  }

  if (!mousePosition) return null

  const hoveredElement = document.elementFromPoint(mousePosition.x, mousePosition.y)
  return hoveredElement?.closest<HTMLElement>('[data-panel-id]') ?? null
}

function getClosestDropZone(rect: DOMRect, mousePosition: { x: number; y: number } | null) {
  if (!mousePosition) return null

  const relativeX = Math.max(0, Math.min(mousePosition.x - rect.left, rect.width))
  const relativeY = Math.max(0, Math.min(mousePosition.y - rect.top, rect.height))
  const distances = {
    left: relativeX,
    right: rect.width - relativeX,
    top: relativeY,
    bottom: rect.height - relativeY,
  }

  return Object.entries(distances).reduce<SplitZoneDropZone>((closest, [zone, distance]) => {
    return distance < distances[closest] ? (zone as SplitZoneDropZone) : closest
  }, 'left')
}

function getPreviewRect(rect: DOMRect, dropZone: SplitZoneDropZone) {
  if (dropZone === 'left') {
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width / 2,
      height: rect.height,
    }
  }

  if (dropZone === 'right') {
    return {
      left: rect.left + rect.width / 2,
      top: rect.top,
      width: rect.width / 2,
      height: rect.height,
    }
  }

  if (dropZone === 'top') {
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height / 2,
    }
  }

  return {
    left: rect.left,
    top: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height / 2,
  }
}

function getDividerRect(rect: DOMRect, dropZone: SplitZoneDropZone) {
  if (dropZone === 'left' || dropZone === 'right') {
    return {
      left: rect.left + rect.width / 2 - 1,
      top: rect.top,
      width: 2,
      height: rect.height,
    }
  }

  return {
    left: rect.left,
    top: rect.top + rect.height / 2 - 1,
    width: rect.width,
    height: 2,
  }
}

export function getSplitZonePreview({
  dropTargetPanel,
  dropZone,
  mousePosition,
}: GetSplitZonePreviewParams): SplitZonePreview | null {
  if (typeof document === 'undefined') return null
  if (dropTargetPanel && !dropZone) return null

  const panel = findPanelElement(dropTargetPanel, mousePosition)
  if (!panel) return null

  const panelRect = panel.getBoundingClientRect()
  const resolvedDropZone = dropZone ?? getClosestDropZone(panelRect, mousePosition)
  if (!resolvedDropZone) return null

  return {
    dropZone: resolvedDropZone,
    panelRect,
    previewRect: getPreviewRect(panelRect, resolvedDropZone),
    dividerRect: getDividerRect(panelRect, resolvedDropZone),
  }
}
