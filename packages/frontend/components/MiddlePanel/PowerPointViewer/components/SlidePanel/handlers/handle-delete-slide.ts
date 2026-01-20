import React from 'react'
import { Slide } from '../../../PowerPointViewer'

interface HandleDeleteSlideParams {
  slides: Slide[]
  currentSlideIndex: number
  saveToHistory: () => void
  toast: (props: {
    title: string
    description: string
    variant?: 'default' | 'destructive'
  }) => void
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>
  setCurrentSlideIndex: React.Dispatch<React.SetStateAction<number>>
  setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>
}

export function handleDeleteSlide({
  slides,
  currentSlideIndex,
  saveToHistory,
  toast,
  setSlides,
  setCurrentSlideIndex,
  setSelectedElementId,
  setHasUnsavedChanges,
}: HandleDeleteSlideParams): void {
  if (slides.length <= 1) {
    toast({
      title: "Cannot delete",
      description: "Presentation must have at least one slide.",
      variant: "destructive",
    })
    return
  }

  saveToHistory()
  setSlides(prev => {
    const newSlides = prev.filter((_, i) => i !== currentSlideIndex)
    return newSlides.map((s, i) => ({ ...s, index: i }))
  })

  if (currentSlideIndex >= slides.length - 1) {
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
  }
  setSelectedElementId(null)
  setHasUnsavedChanges(true)
}
