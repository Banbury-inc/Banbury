import React from 'react'
import { Slide } from '../../../PowerPointViewer'

interface HandleDeleteSlideByIndexParams {
  slides: Slide[]
  index: number
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

export function handleDeleteSlideByIndex({
  slides,
  index,
  currentSlideIndex,
  saveToHistory,
  toast,
  setSlides,
  setCurrentSlideIndex,
  setSelectedElementId,
  setHasUnsavedChanges,
}: HandleDeleteSlideByIndexParams): void {
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
    const newSlides = prev.filter((_, i) => i !== index)
    return newSlides.map((s, i) => ({ ...s, index: i }))
  })

  if (index === currentSlideIndex) {
    if (index >= slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, index - 1))
    } else {
      setCurrentSlideIndex(index)
    }
  } else if (index < currentSlideIndex) {
    setCurrentSlideIndex(currentSlideIndex - 1)
  }
  setSelectedElementId(null)
  setHasUnsavedChanges(true)
}
