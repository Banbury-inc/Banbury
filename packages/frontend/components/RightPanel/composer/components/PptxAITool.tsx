import { Presentation } from 'lucide-react'
import React, { useMemo } from 'react'
import { AIToolCard } from './AIToolCard'

import type { AIToolCardConfig } from './AIToolCard'

interface PptxOperationCreateSlide { type: 'createSlide'; slideIndex?: number; layout?: 'title' | 'content' | 'twoColumn' | 'blank'; background?: string }
interface PptxOperationDeleteSlide { type: 'deleteSlide'; slideIndex: number }
interface PptxOperationReorderSlides { type: 'reorderSlides'; fromIndex: number; toIndex: number }
interface PptxOperationAddText { 
  type: 'addText'; 
  slideIndex?: number; 
  element: { 
    x: number; y: number; width: number; height: number; 
    content: string; fontSize?: number; fontFace?: string; 
    color?: string; bold?: boolean; italic?: boolean; 
    align?: 'left' | 'center' | 'right'; valign?: 'top' | 'middle' | 'bottom' 
  } 
}
interface PptxOperationAddShape { 
  type: 'addShape'; 
  slideIndex?: number; 
  element: { 
    x: number; y: number; width: number; height: number; 
    shapeType: 'rect' | 'ellipse' | 'triangle' | 'arrow' | 'line'; 
    fill?: string; stroke?: string; strokeWidth?: number 
  } 
}
interface PptxOperationAddImage { 
  type: 'addImage'; 
  slideIndex?: number; 
  element: { x: number; y: number; width: number; height: number; imageUrl: string } 
}
interface PptxOperationUpdateElement { 
  type: 'updateElement'; 
  slideIndex?: number; 
  elementId: string; 
  element: { 
    x?: number; y?: number; width?: number; height?: number; 
    content?: string; fontSize?: number; color?: string; 
    bold?: boolean; italic?: boolean; fill?: string; stroke?: string 
  } 
}
interface PptxOperationDeleteElement { type: 'deleteElement'; slideIndex?: number; elementId: string }
interface PptxOperationSetSlideBackground { type: 'setSlideBackground'; slideIndex?: number; background: string }
interface PptxOperationApplyTheme { type: 'applyTheme'; theme: 'default' | 'dark' | 'light' | 'corporate' | 'creative' }

type PptxOperation =
  | PptxOperationCreateSlide
  | PptxOperationDeleteSlide
  | PptxOperationReorderSlides
  | PptxOperationAddText
  | PptxOperationAddShape
  | PptxOperationAddImage
  | PptxOperationUpdateElement
  | PptxOperationDeleteElement
  | PptxOperationSetSlideBackground
  | PptxOperationApplyTheme

interface PptxAIToolProps {
  args?: {
    action: string
    presentationName?: string
    operations?: PptxOperation[]
    slidesData?: any
    note?: string
  }
  action?: string
  presentationName?: string
  operations?: PptxOperation[]
  slidesData?: any
  note?: string
}

export const PptxAITool: React.FC<PptxAIToolProps> = (props) => {
  const { action, presentationName, operations, slidesData, note } = props.args || props

  const hasContent = Boolean(slidesData || (operations && operations.length > 0))

  const config: AIToolCardConfig = useMemo(() => ({
    icon: Presentation,
    displayName: presentationName || 'Presentation',
    changeType: 'presentation',
    eventPrefix: 'powerpoint-ai',
    fileExtensions: ['.pptx', '.ppt']
  }), [presentationName])

  const payload = useMemo(() => ({
    action: action || 'Presentation edits',
    presentationName: config.displayName,
    operations: operations || [],
    slidesData,
    note
  }), [action, config.displayName, operations, slidesData, note])

  return (
    <AIToolCard
      config={config}
      args={payload}
      hasContent={hasContent}
    />
  )
}

export default PptxAITool

