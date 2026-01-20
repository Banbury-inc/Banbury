import React from 'react'
import { Slide } from '../../../PowerPointViewer'

interface HandleAddSlideParams {
  slides: Slide[]
  saveToHistory: () => void
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>
  setCurrentSlideIndex: React.Dispatch<React.SetStateAction<number>>
  setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>
}

export function handleAddSlide({
  slides,
  saveToHistory,
  setSlides,
  setCurrentSlideIndex,
  setSelectedElementId,
  setHasUnsavedChanges,
}: HandleAddSlideParams): void {
  saveToHistory()
  const newSlide: Slide = {
    id: `slide-${Date.now()}`,
    index: slides.length,
    elements: [{
      id: `text-${Date.now()}`,
      type: 'text',
      x: 10,
      y: 40,
      width: 80,
      height: 20,
      content: 'Click to edit',
      fontSize: 44,
      fontFace: 'Arial',
      color: '363636',
      bold: true,
      align: 'center',
      valign: 'middle',
    }],
    layout: 'title',
  }
  setSlides(prev => [...prev, newSlide])
  setCurrentSlideIndex(slides.length)
  setSelectedElementId(null)
  setHasUnsavedChanges(true)
}
