import React from 'react'
import { getSplitZonePreview, type SplitZoneDropZone } from './handlers/split-zone-preview'

interface SplitZonesProps {
  isVisible: boolean
  mousePosition: { x: number; y: number } | null
  dropTargetPanel?: string | null
  dropZone?: SplitZoneDropZone | null
}

export function SplitZones({ isVisible, mousePosition, dropTargetPanel = null, dropZone = null }: SplitZonesProps) {
  if (!isVisible) return null

  const preview = getSplitZonePreview({ dropTargetPanel, dropZone, mousePosition })
  if (!preview) return null

  const isHorizontalSplit = preview.dropZone === 'top' || preview.dropZone === 'bottom'
  const label = `Split ${preview.dropZone}`

  return (
    <>
      <div
        className="fixed pointer-events-none z-[9998] rounded-md border-2 border-primary bg-primary/10 ring-1 ring-primary/30 transition-all duration-150"
        style={preview.previewRect}
      >
        <div className="absolute inset-2 rounded border border-primary/40" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-background/90 px-2 py-1 text-xs font-medium capitalize text-foreground shadow-sm">
          {label}
        </div>
      </div>
      <div
        className="fixed pointer-events-none z-[9999] rounded-full bg-primary shadow-lg shadow-primary/30 transition-all duration-150"
        style={preview.dividerRect}
      />
      <div
        className="fixed pointer-events-none z-[9997] rounded-md border border-dashed border-primary/40 transition-all duration-150"
        style={{
          left: preview.panelRect.left,
          top: preview.panelRect.top,
          width: preview.panelRect.width,
          height: preview.panelRect.height,
        }}
      >
        <div
          className={`absolute bg-primary/20 ${
            isHorizontalSplit
              ? 'left-0 top-1/2 h-px w-full -translate-y-1/2'
              : 'left-1/2 top-0 h-full w-px -translate-x-1/2'
          }`}
        />
      </div>
    </>
  )
}
