import React from 'react'
import { Slide } from '../PowerPointViewer'
import {
  resolveWebImageToDataUrl,
  resolveDriveImageToDataUrl,
  resolveS3ImageToDataUrl,
} from '../components/PowerPointToolbar/handlers/powerpoint-image-handlers'

interface HandleResolveImagesParams {
  slides: Slide[]
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>
}

export async function handleResolveImages({
  slides,
  setSlides,
  setHasUnsavedChanges,
}: HandleResolveImagesParams): Promise<void> {
  let hasChanges = false
  const updatedSlides = await Promise.all(
    slides.map(async (slide) => {
      const updatedElements = await Promise.all(
        slide.elements.map(async (element) => {
          // Skip if not an image or already has a data URL
          if (element.type !== 'image') return element
          if (element.imageUrl && element.imageUrl.startsWith('data:')) return element
          
          // Check if we need to resolve an image reference
          const needsResolution = element.driveFileId || element.s3FileId || 
            (element.imageUrl && (element.imageUrl.startsWith('http://') || element.imageUrl.startsWith('https://')))
          
          if (!needsResolution) return element
          
          try {
            let dataUrl: string | null = null
            
            if (element.driveFileId) {
              dataUrl = await resolveDriveImageToDataUrl(element.driveFileId)
            } else if (element.s3FileId) {
              // Use stored fileName or fallback
              const fileName = element.s3FileName || `image-${element.s3FileId}.jpg`
              dataUrl = await resolveS3ImageToDataUrl(element.s3FileId, fileName)
            } else if (element.imageUrl) {
              dataUrl = await resolveWebImageToDataUrl(element.imageUrl)
            }
            
            if (dataUrl) {
              hasChanges = true
              return {
                ...element,
                imageUrl: dataUrl,
                // Clear the reference fields once resolved
                driveFileId: undefined,
                s3FileId: undefined,
                s3FileName: undefined,
              }
            }
          } catch (error) {
            console.error('Failed to resolve image:', error)
            // Keep the element as-is if resolution fails
          }
          
          return element
        })
      )
      
      return {
        ...slide,
        elements: updatedElements,
      }
    })
  )
  
  if (hasChanges) {
    setSlides(updatedSlides)
    setHasUnsavedChanges(true)
  }
}
