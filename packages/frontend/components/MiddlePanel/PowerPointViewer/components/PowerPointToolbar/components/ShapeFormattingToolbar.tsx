import { useState, useCallback } from 'react'
import { SlideElement } from '../../../PowerPointViewer'
import {
  setShapeFillSolid,
  setShapeFillGradient,
} from '../handlers/advanced-format-handlers'
import { fillStyleToColorString } from '../../../utils/fill-utils'
import { Button } from '../../../../../ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '../../../../../ui/popover'
import { Label } from '../../../../../ui/label'
import { ColorPicker } from './ColorPicker'
import { Paintbrush } from 'lucide-react'
import { getShapeDefinition } from '../../shape-catalog'

interface ShapeFormattingToolbarProps {
  selectedElement: SlideElement
  onUpdateElement: (updates: Partial<SlideElement>) => void
}

export function ShapeFormattingToolbar({
  selectedElement,
  onUpdateElement,
}: ShapeFormattingToolbarProps) {
  const [fillColorOpen, setFillColorOpen] = useState(false)
  const [strokeColorOpen, setStrokeColorOpen] = useState(false)
  const [shapeGradientOpen, setShapeGradientOpen] = useState(false)
  const [gradientStartColor, setGradientStartColor] = useState('#ffffff')
  const [gradientEndColor, setGradientEndColor] = useState('#000000')
  const [gradientAngle, setGradientAngle] = useState(90)

  // Shape formatting handlers
  const handleFillColorChange = useCallback((color: string) => {
    if (selectedElement.type === 'shape') {
      const updates = setShapeFillSolid(selectedElement, color)
      onUpdateElement(updates)
    }
    setFillColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleShapeGradientApply = useCallback(() => {
    if (selectedElement.type === 'shape') {
      const updates = setShapeFillGradient(selectedElement, gradientStartColor, gradientEndColor, gradientAngle)
      onUpdateElement(updates)
    }
    setShapeGradientOpen(false)
  }, [selectedElement, gradientStartColor, gradientEndColor, gradientAngle, onUpdateElement])

  const handleStrokeColorChange = useCallback((color: string) => {
    if (selectedElement.type === 'shape') {
      // If element has a border object (from PPTX), update its color
      // Otherwise, update the simple stroke property
      if (selectedElement.border) {
        onUpdateElement({ border: { ...selectedElement.border, color } })
      } else {
        onUpdateElement({ stroke: color })
      }
    }
    setStrokeColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElement.type !== 'shape') return
    const width = Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
    onUpdateElement({ strokeWidth: width })
  }, [selectedElement, onUpdateElement])

  const handleRotationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElement.type !== 'shape') return
    const rotation = Math.min(360, Math.max(0, parseInt(e.target.value) || 0))
    onUpdateElement({ rotation })
  }, [selectedElement, onUpdateElement])

  const handleShapeLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElement.type !== 'shape') return
    onUpdateElement({ content: e.target.value })
  }, [selectedElement, onUpdateElement])

  if (selectedElement.type !== 'shape') {
    return null
  }

  return (
    <>
      <div className="w-px h-6 bg-border mx-1" />

      {/* Shape Fill with Gradient */}
      <div className="flex items-center gap-0">
        <ColorPicker
          colorType="fill"
          isOpen={fillColorOpen}
          setIsOpen={setFillColorOpen}
          currentColor={fillStyleToColorString(selectedElement.fill) || '#4a90d9'}
          onColorChange={handleFillColorChange}
        />
        <Popover open={shapeGradientOpen} onOpenChange={setShapeGradientOpen}>
          <PopoverTrigger asChild>
            <Button variant="primary" size="icon-xs" title="Shape Fill Gradient" className="ml-1">
              <div className="w-4 h-4" style={{ background: 'linear-gradient(90deg, #ff0000, #0000ff)' }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Gradient Fill</h4>
              <div className="space-y-2">
                <Label className="text-xs">Start Color</Label>
                <input
                  type="color"
                  className="w-full h-8 cursor-pointer border rounded"
                  value={gradientStartColor}
                  onChange={(e) => setGradientStartColor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">End Color</Label>
                <input
                  type="color"
                  className="w-full h-8 cursor-pointer border rounded"
                  value={gradientEndColor}
                  onChange={(e) => setGradientEndColor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Angle: {gradientAngle}°</Label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  className="w-full"
                  value={gradientAngle}
                  onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                />
              </div>
              <Button onClick={handleShapeGradientApply} className="w-full" size="xs">
                Apply Gradient
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <ColorPicker
        colorType="stroke"
        isOpen={strokeColorOpen}
        setIsOpen={setStrokeColorOpen}
        currentColor={selectedElement.stroke || '#2d5a8c'}
        onColorChange={handleStrokeColorChange}
      />

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Stroke</span>
        <input
          type="number"
          className="w-14 h-7 text-center text-xs border border-border rounded bg-background"
          value={Math.round(selectedElement.strokeWidth ?? 2)}
          onChange={handleStrokeWidthChange}
          min={0}
          max={20}
        />
      </div>

      <div className="flex items-center gap-2 w-40">
        <span className="text-xs text-muted-foreground">Rotate</span>
        <input
          type="range"
          className="flex-1 h-2 accent-primary"
          min={0}
          max={360}
          value={Math.round(selectedElement.rotation ?? 0)}
          onChange={handleRotationChange}
        />
        <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(selectedElement.rotation ?? 0)}°</span>
      </div>

      {getShapeDefinition(selectedElement.shapeType || undefined)?.supportsLabel && (
        <input
          type="text"
          className="h-7 w-32 text-xs border border-border rounded bg-background px-2"
          placeholder="Shape label"
          value={selectedElement.content || ''}
          onChange={handleShapeLabelChange}
        />
      )}
    </>
  )
}
