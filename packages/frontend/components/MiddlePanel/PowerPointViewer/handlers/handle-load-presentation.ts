import React from 'react'
import { ApiService } from '../../../../../backend/api/apiService'
import { FileSystemItem } from '../../../../utils/fileTreeUtils'
import { Slide } from '../PowerPointViewer'
import { pushToHistory, canUndo, canRedo } from '../components/PowerPointToolbar/handlers/powerpoint-toolbar-handlers'
import { parsePptxFile } from '../utils/parse-pptx-file'

interface HandleLoadPresentationParams {
  currentFile: FileSystemItem
  lastFetchKeyRef: React.MutableRefObject<string | null>
  toast: (props: {
    title: string
    description: string
    variant?: 'default' | 'destructive'
  }) => void
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>
  setCurrentSlideIndex: React.Dispatch<React.SetStateAction<number>>
  setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setUndoAvailable: React.Dispatch<React.SetStateAction<boolean>>
  setRedoAvailable: React.Dispatch<React.SetStateAction<boolean>>
}

export async function handleLoadPresentation({
  currentFile,
  lastFetchKeyRef,
  toast,
  setSlides,
  setCurrentSlideIndex,
  setSelectedElementId,
  setError,
  setLoading,
  setUndoAvailable,
  setRedoAvailable,
}: HandleLoadPresentationParams): Promise<void> {
  const fetchKey = `${currentFile.file_id}|${currentFile.name}`
  if (lastFetchKeyRef.current === fetchKey) return
  lastFetchKeyRef.current = fetchKey

  if (!currentFile.file_id) {
    setError('No file ID available for this presentation')
    setLoading(false)
    return
  }

  setLoading(true)
  setError(null)

  try {
    // Check if this is a Google Drive or OneDrive file
    const isDriveFile = currentFile.path?.startsWith('drive://')
    const isOneDriveFile = currentFile.path?.startsWith('onedrive://')
    const isGoogleSlides = currentFile.mimeType?.includes('vnd.google-apps.presentation')

    let blob: Blob

    if (isDriveFile && isGoogleSlides) {
      // Export Google Slides as PPTX
      blob = await ApiService.Drive.exportSlidesAsPptx(currentFile.file_id)
    } else if (isOneDriveFile) {
      // Download from OneDrive
      blob = await ApiService.OneDrive.getFileBlob(currentFile.file_id)
    } else {
      // Download regular file from S3
      const result = await ApiService.downloadFromS3(currentFile.file_id, currentFile.name)
      if (!result.success || !result.blob) {
        throw new Error('Failed to load presentation')
      }
      blob = result.blob
    }

    // Parse the PPTX file
    const parsedSlides = await parsePptxFile({ blob, toast })
    setSlides(parsedSlides)
    setCurrentSlideIndex(0)
    setSelectedElementId(null)
    
    // Initialize history
    pushToHistory(parsedSlides, 0)
    setUndoAvailable(canUndo())
    setRedoAvailable(canRedo())
  } catch (err) {
    console.error('PowerPointViewer: Error loading presentation:', err)
    setError('Failed to load presentation')
  } finally {
    setLoading(false)
  }
}
