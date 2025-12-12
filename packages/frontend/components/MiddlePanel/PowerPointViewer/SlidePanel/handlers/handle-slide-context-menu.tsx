import React from 'react'
import { Slide } from '../../../PowerPointViewer'
import { Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}

interface SlideContextMenuHandlers {
  onDeleteSlide: (index: number) => void
  onDuplicateSlide: (index: number) => void
  onInsertSlideBefore: (index: number) => void
  onInsertSlideAfter: (index: number) => void
  canDeleteSlide: (index: number) => boolean
}

export function getSlideContextMenuItems(
  slideIndex: number,
  handlers: SlideContextMenuHandlers
): ContextMenuItem[] {
  const canDelete = handlers.canDeleteSlide(slideIndex)

  return [
    {
      label: 'Duplicate Slide',
      icon: <Copy size={16} />,
      onClick: () => handlers.onDuplicateSlide(slideIndex),
    },
    {
      label: 'Insert Slide Before',
      icon: <ArrowUp size={16} />,
      onClick: () => handlers.onInsertSlideBefore(slideIndex),
    },
    {
      label: 'Insert Slide After',
      icon: <ArrowDown size={16} />,
      onClick: () => handlers.onInsertSlideAfter(slideIndex),
    },
    {
      label: 'Delete Slide',
      icon: <Trash2 size={16} />,
      onClick: () => handlers.onDeleteSlide(slideIndex),
      disabled: !canDelete,
      destructive: true,
    },
  ]
}

export function duplicateSlide(slides: Slide[], slideIndex: number): Slide[] {
  const slideToDuplicate = slides[slideIndex]
  const duplicatedSlide: Slide = {
    ...slideToDuplicate,
    id: `slide-${Date.now()}`,
    index: slideIndex + 1,
    elements: slideToDuplicate.elements.map(el => ({
      ...el,
      id: `${el.id}-${Date.now()}`,
    })),
  }
  
  const newSlides = [...slides]
  newSlides.splice(slideIndex + 1, 0, duplicatedSlide)
  return newSlides.map((s, i) => ({ ...s, index: i }))
}

export function insertSlideBefore(slides: Slide[], slideIndex: number): Slide[] {
  const newSlide: Slide = {
    id: `slide-${Date.now()}`,
    index: slideIndex,
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
  
  const newSlides = [...slides]
  newSlides.splice(slideIndex, 0, newSlide)
  return newSlides.map((s, i) => ({ ...s, index: i }))
}

export function insertSlideAfter(slides: Slide[], slideIndex: number): Slide[] {
  const newSlide: Slide = {
    id: `slide-${Date.now()}`,
    index: slideIndex + 1,
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
  
  const newSlides = [...slides]
  newSlides.splice(slideIndex + 1, 0, newSlide)
  return newSlides.map((s, i) => ({ ...s, index: i }))
}

