import { ZoomIn, ZoomOut } from 'lucide-react'

import { Button } from '../../common/ui/button'
import {
  DEFAULT_IMAGE_ZOOM,
  MAX_IMAGE_ZOOM,
  MIN_IMAGE_ZOOM,
} from './handlers/image-zoom-handlers'

interface ImageViewerToolbarProps {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

export function ImageViewerToolbar({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ImageViewerToolbarProps) {
  const isZoomedDefault = zoomLevel === DEFAULT_IMAGE_ZOOM

  return (
    <div className="flex items-center justify-end border-b border-border bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="icon-xs"
          onClick={onZoomOut}
          disabled={zoomLevel <= MIN_IMAGE_ZOOM}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="primary"
          size="xs"
          onClick={onResetZoom}
          disabled={isZoomedDefault}
          title="Reset zoom to 100%"
          aria-label="Reset zoom to 100%"
        >
          {Math.round(zoomLevel * 100)}%
        </Button>
        <Button
          variant="primary"
          size="icon-xs"
          onClick={onZoomIn}
          disabled={zoomLevel >= MAX_IMAGE_ZOOM}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
