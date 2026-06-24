import { useRef, useState } from 'react'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'

import { ImageViewerToolbar } from './ImageViewerToolbar'
import {
  createImagePanMoveHandler,
  createImagePanStartHandler,
  createImagePanStopHandler,
} from './handlers/image-pan-handlers'
import {
  DEFAULT_IMAGE_ZOOM,
  createImageWheelZoomHandler,
  createImageZoomInHandler,
  createImageZoomOutHandler,
  createImageZoomResetHandler,
} from './handlers/image-zoom-handlers'

const IMAGE_URL_PREVIEW_WIDTH = 1200
const IMAGE_URL_PREVIEW_HEIGHT = 900

interface ImageUrlViewerProps {
  src: string
  alt: string
}

export function ImageUrlViewer({ src, alt }: Readonly<ImageUrlViewerProps>) {
  const [hasError, setHasError] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_IMAGE_ZOOM)
  const viewerRef = useRef<HTMLDivElement | null>(null)
  const isPanningRef = useRef(false)
  const panStartXRef = useRef(0)
  const panStartYRef = useRef(0)
  const panScrollLeftRef = useRef(0)
  const panScrollTopRef = useRef(0)
  const handleZoomIn = createImageZoomInHandler(setZoomLevel)
  const handleZoomOut = createImageZoomOutHandler(setZoomLevel)
  const handleResetZoom = createImageZoomResetHandler(setZoomLevel)
  const handleWheelZoom = createImageWheelZoomHandler(setZoomLevel)
  const imagePanOptions = {
    viewerRef,
    isPanningRef,
    startXRef: panStartXRef,
    startYRef: panStartYRef,
    scrollLeftRef: panScrollLeftRef,
    scrollTopRef: panScrollTopRef,
  }
  const handlePanStart = createImagePanStartHandler(imagePanOptions)
  const handlePanMove = createImagePanMoveHandler(imagePanOptions)
  const handlePanStop = createImagePanStopHandler(isPanningRef)

  return (
    <div className="flex h-full flex-col bg-background">
      <ImageViewerToolbar
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />
      <div
        ref={viewerRef}
        className="flex-1 cursor-grab select-none overflow-auto bg-background p-6 active:cursor-grabbing"
        onWheel={handleWheelZoom}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanStop}
        onMouseLeave={handlePanStop}
      >
        {hasError ? (
          <div className="flex min-h-full items-center justify-center">
            <div className="flex max-w-md flex-col items-center gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Image could not be loaded.</p>
            </div>
          </div>
        ) : (
          <div className="flex h-max min-h-full w-max min-w-full items-center justify-center">
            <Image
              src={src}
              alt={alt}
              width={IMAGE_URL_PREVIEW_WIDTH}
              height={IMAGE_URL_PREVIEW_HEIGHT}
              className="max-h-none max-w-none rounded-lg object-contain shadow-lg"
              style={{
                width: IMAGE_URL_PREVIEW_WIDTH * zoomLevel,
                height: IMAGE_URL_PREVIEW_HEIGHT * zoomLevel,
              }}
              unoptimized
              draggable={false}
              onError={() => setHasError(true)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
