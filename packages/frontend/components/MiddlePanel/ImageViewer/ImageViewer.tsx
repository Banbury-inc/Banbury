import { AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

import { ApiService } from '../../../../backend/api/apiService'
import { FileSystemItem } from '../../../utils/fileTreeUtils';
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

const IMAGE_PREVIEW_WIDTH = 800
const IMAGE_PREVIEW_HEIGHT = 600

interface ImageViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
}

export function ImageViewer({ file }: ImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_IMAGE_ZOOM);
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

  useEffect(() => {
    let currentUrl: string | null = null;

    const loadImage = async () => {
      if (!file.file_id) {
        setError('No file ID available for this image');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setZoomLevel(DEFAULT_IMAGE_ZOOM);

      try {
        const isDriveFile = file.path?.startsWith('drive://');
        const isOneDriveFile = file.path?.startsWith('onedrive://');
        const isDropboxFile = file.path?.startsWith('dropbox://');
        
        if (isDriveFile) {
          // Handle Google Drive file
          const blob = await ApiService.Drive.getFileBlob(file.file_id);
          const url = window.URL.createObjectURL(blob);
          currentUrl = url;
          setImageUrl(url);
        } else if (isOneDriveFile) {
          // Handle OneDrive file
          const blob = await ApiService.OneDrive.getFileBlob(file.file_id);
          const url = window.URL.createObjectURL(blob);
          currentUrl = url;
          setImageUrl(url);
        } else if (isDropboxFile) {
          const blob = await ApiService.Dropbox.getFileBlob(file.file_id);
          const url = window.URL.createObjectURL(blob);
          currentUrl = url;
          setImageUrl(url);
        } else {
          // Handle local/S3 file
          const result = await ApiService.downloadFromS3(file.file_id, file.name);
          if (result.success && result.url) {
            currentUrl = result.url;
            setImageUrl(result.url);
          } else {
            setError('Failed to load image content');
          }
        }
      } catch (_err) {
        setError('Failed to load image content');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup function to revoke blob URL
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(currentUrl);
      }
    };
  }, [file.file_id, file.name, file.path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load image</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
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
        {imageUrl ? (
          <div className="flex h-max min-h-full w-max min-w-full items-center justify-center">
            <Image
              src={imageUrl}
              alt={file.name}
              width={IMAGE_PREVIEW_WIDTH}
              height={IMAGE_PREVIEW_HEIGHT}
              className="max-h-none max-w-none rounded-lg object-contain shadow-lg"
              style={{
                width: IMAGE_PREVIEW_WIDTH * zoomLevel,
                height: IMAGE_PREVIEW_HEIGHT * zoomLevel,
              }}
              unoptimized
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Image URL not available</p>
          </div>
        )}
      </div>
    </div>
  );
}
