import { ApiService } from '../../../../../backend/api/apiService'
import { FileSystemItem } from '../../../../utils/fileTreeUtils'
import { Slide } from '../PowerPointViewer'
import { slidesToPptx } from '../utils/pptx-export-utils'

interface ToastFunction {
  (options: {
    title: string
    description: string
    variant: "success" | "destructive"
  }): void
}

interface SavePowerPointParams {
  currentFile: FileSystemItem
  slides: Slide[]
  toast: ToastFunction
  onSaveComplete?: () => void
}

export async function handlePowerPointSave({
  currentFile,
  slides,
  toast,
  onSaveComplete,
}: SavePowerPointParams): Promise<void> {
  if (!currentFile.file_id) return

  try {
    // Convert slides to PPTX
    const pptx = await slidesToPptx(slides)

    // Set metadata
    pptx.author = 'Banbury Editor'
    pptx.title = currentFile.name.replace(/\.pptx$/i, '')
    pptx.subject = 'Edited with Banbury'

    // Generate PPTX blob
    const blob = await pptx.write({ outputType: 'blob' }) as Blob

    // Check if this is a Google Drive file
    const isDriveFile = currentFile.path?.startsWith('drive://')
    const isGoogleSlides = currentFile.mimeType?.includes('vnd.google-apps.presentation')

    // Create File object
    const fileToUpload = new File([blob], currentFile.name, {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    })

    if (isDriveFile && isGoogleSlides) {
      // Save to Google Drive
      await ApiService.Drive.updateFile(
        currentFile.file_id,
        fileToUpload,
        currentFile.name
      )

      toast({
        title: "Presentation saved to Google Drive",
        description: `${currentFile.name} has been updated successfully.`,
        variant: "success",
      })
    } else {
      // Update the existing file in S3
      const updateResult = await ApiService.Files.updateS3File(
        currentFile.file_id || currentFile.id,
        fileToUpload,
        currentFile.name
      )

      if (!updateResult.success) {
        throw new Error('Failed to update file')
      }

      toast({
        title: "Presentation saved successfully",
        description: `${currentFile.name} has been saved.`,
        variant: "success",
      })
    }

    // Call save complete callback if provided
    if (onSaveComplete) {
      onSaveComplete()
    }
  } catch (error) {
    console.error('Error saving presentation:', error)
    toast({
      title: "Save failed",
      description: `Failed to save presentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    })
    throw error
  }
}

// Helper function to convert slides to JSON for AI context
export function slidesToJson(slides: Slide[]): string {
  return JSON.stringify(slides.map(slide => ({
    id: slide.id,
    index: slide.index,
    layout: slide.layout,
    background: slide.background,
    elementsCount: slide.elements.length,
    elements: slide.elements.map(el => ({
      id: el.id,
      type: el.type,
      x: Math.round(el.x),
      y: Math.round(el.y),
      width: Math.round(el.width),
      height: Math.round(el.height),
      ...(el.type === 'text' && {
        content: el.content?.substring(0, 100),
        fontSize: el.fontSize,
      }),
      ...(el.type === 'shape' && {
        shapeType: el.shapeType,
        fill: el.fill,
      }),
      ...(el.type === 'image' && {
        hasImage: !!el.imageUrl,
      }),
    })),
  })), null, 2)
}

