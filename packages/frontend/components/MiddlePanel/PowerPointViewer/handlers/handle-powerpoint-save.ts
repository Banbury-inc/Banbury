import { ApiService } from '../../../../../backend/api/apiService'
import { FileSystemItem } from '../../../../utils/fileTreeUtils'
import { Slide, SlideElement } from '../PowerPointViewer'

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
    // Import pptxgenjs dynamically
    const PptxGenJS = (await import('pptxgenjs')).default
    const pptx = new PptxGenJS()

    // Set metadata
    pptx.author = 'Banbury Editor'
    pptx.title = currentFile.name.replace(/\.pptx$/i, '')
    pptx.subject = 'Edited with Banbury'

    // Convert slides to PPTX format
    for (const slide of slides) {
      const pptxSlide = pptx.addSlide()

      // Set background
      if (slide.background) {
        pptxSlide.background = { color: slide.background.replace('#', '') }
      }

      // Add elements
      for (const element of slide.elements) {
        addElementToSlide(pptxSlide, element)
      }

      // Add notes if present
      if (slide.notes) {
        pptxSlide.addNotes(slide.notes)
      }
    }

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

// Helper function to add element to pptx slide
function addElementToSlide(pptxSlide: any, element: SlideElement): void {
  switch (element.type) {
    case 'text':
      pptxSlide.addText(element.content || '', {
        x: `${element.x}%`,
        y: `${element.y}%`,
        w: `${element.width}%`,
        h: `${element.height}%`,
        fontSize: element.fontSize || 18,
        fontFace: element.fontFace || 'Arial',
        color: element.color || '363636',
        bold: element.bold || false,
        italic: element.italic || false,
        align: element.align || 'left',
        valign: element.valign || 'top',
      })
      break

    case 'shape':
      const shapeTypeMap: Record<string, string> = {
        rect: 'rect',
        'round-rect': 'roundRect',
        ellipse: 'ellipse',
        circle: 'ellipse',
        triangle: 'triangle',
        'right-triangle': 'triangle',
        diamond: 'diamond',
        hexagon: 'hexagon',
        line: 'line',
        'line-diagonal': 'line',
        'arrow-right': 'rightArrow',
        'arrow-left': 'leftArrow',
        'arrow-up': 'upArrow',
        'arrow-down': 'downArrow',
        chevron: 'chevron',
        heart: 'heart',
        cloud: 'cloud',
        'star-5': 'star5',
        'star-6': 'star6',
        'star-7': 'star7',
        'star-8': 'star8',
        'star-10': 'star10',
        'star-12': 'star12',
        'pie-half': 'pie',
        'pie-quarter': 'pie',
        'pie-three-quarter': 'pie',
        cylinder: 'can',
      }
      const pptxShape = (shapeTypeMap[element.shapeType || 'rect'] || 'rect') as any
      pptxSlide.addShape(pptxShape, {
        x: `${element.x}%`,
        y: `${element.y}%`,
        w: `${element.width}%`,
        h: `${element.height}%`,
        fill: element.fill ? { color: element.fill.replace('#', '') } : undefined,
        line: element.stroke ? {
          color: element.stroke.replace('#', ''),
          width: element.strokeWidth || 1
        } : undefined,
        rotate: element.rotation || 0,
      })
      if (element.content) {
        pptxSlide.addText(element.content, {
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
          align: 'center',
          valign: 'middle',
          color: element.stroke?.replace('#', '') || '363636',
          fontSize: Math.max(12, (element.fontSize || 18) * 0.5),
        })
      }
      break

    case 'image':
      if (element.imageUrl) {
        // Check if it's a data URL or external URL
        const imageOptions: any = {
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`,
        }

        if (element.imageUrl.startsWith('data:')) {
          imageOptions.data = element.imageUrl
        } else {
          imageOptions.path = element.imageUrl
        }

        pptxSlide.addImage(imageOptions)
      }
      break
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

