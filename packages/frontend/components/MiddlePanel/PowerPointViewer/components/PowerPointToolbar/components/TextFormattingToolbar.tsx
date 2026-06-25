import { useState, useCallback } from 'react'
import { SlideElement } from '../../../PowerPointViewer'
import {
  incrementFontSize,
  decrementFontSize,
  toHexColor,
  normalizeColor,
} from '../handlers/powerpoint-toolbar-handlers'
import {
  setTextFillSolid,
  setTextFillGradient,
  clearTextFill,
  setTextBorder,
  clearTextBorder,
  addHighlight,
} from '../handlers/advanced-format-handlers'
import { fillStyleToColorString } from '../../../utils/fill-utils'
import { Button } from '../../../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../../../../common/ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from '../../../../../common/ui/popover'
import { Label } from '../../../../../common/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../../common/ui/tabs'
import { ColorPicker, colorPalette } from './ColorPicker'
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ChevronDown,
  Paintbrush,
  PaintBucket,
  Plus,
  Minus,
} from 'lucide-react'

interface TextFormattingToolbarProps {
  selectedElement: SlideElement
  textSelection?: { start: number; end: number } | null
  onUpdateElement: (updates: Partial<SlideElement>) => void
}

export function TextFormattingToolbar({
  selectedElement,
  textSelection,
  onUpdateElement,
}: TextFormattingToolbarProps) {
  const [textColorOpen, setTextColorOpen] = useState(false)
  const [textBackgroundOpen, setTextBackgroundOpen] = useState(false)
  const [textBorderColorOpen, setTextBorderColorOpen] = useState(false)
  const [highlightColorOpen, setHighlightColorOpen] = useState(false)
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false)
  const [textBackgroundTab, setTextBackgroundTab] = useState<'solid' | 'gradient'>('solid')
  const [gradientStartColor, setGradientStartColor] = useState('#ffffff')
  const [gradientEndColor, setGradientEndColor] = useState('#000000')
  const [gradientAngle, setGradientAngle] = useState(90)

  // Text formatting handlers
  const handleToggleBold = useCallback(() => {
    if (selectedElement.type === 'text') {
      onUpdateElement({ bold: !selectedElement.bold })
    }
  }, [selectedElement, onUpdateElement])

  const handleToggleItalic = useCallback(() => {
    if (selectedElement.type === 'text') {
      onUpdateElement({ italic: !selectedElement.italic })
    }
  }, [selectedElement, onUpdateElement])

  const handleFontSizeIncrement = useCallback(() => {
    if (selectedElement.type === 'text') {
      const newSize = incrementFontSize(selectedElement.fontSize || 18)
      onUpdateElement({ fontSize: newSize })
    }
  }, [selectedElement, onUpdateElement])

  const handleFontSizeDecrement = useCallback(() => {
    if (selectedElement.type === 'text') {
      const newSize = decrementFontSize(selectedElement.fontSize || 18)
      onUpdateElement({ fontSize: newSize })
    }
  }, [selectedElement, onUpdateElement])

  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElement.type === 'text') {
      const size = parseInt(e.target.value) || 18
      onUpdateElement({ fontSize: Math.min(Math.max(size, 8), 200) })
    }
  }, [selectedElement, onUpdateElement])

  const handleTextAlign = useCallback((align: 'left' | 'center' | 'right') => {
    if (selectedElement.type === 'text') {
      onUpdateElement({ align })
    }
  }, [selectedElement, onUpdateElement])

  const handleVerticalAlign = useCallback((valign: 'top' | 'middle' | 'bottom') => {
    if (selectedElement.type === 'text') {
      onUpdateElement({ valign })
    }
  }, [selectedElement, onUpdateElement])

  const handleTextColorChange = useCallback((color: string) => {
    if (selectedElement.type === 'text') {
      onUpdateElement({ color: normalizeColor(color) })
    }
    setTextColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleFontFaceChange = useCallback((fontFace: string) => {
    if (selectedElement.type === 'text') {
      onUpdateElement({ fontFace })
    }
    setFontDropdownOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleTextBackgroundChange = useCallback((color: string) => {
    if (selectedElement.type === 'text') {
      const updates = setTextFillSolid(selectedElement, color)
      onUpdateElement(updates)
    }
    setTextBackgroundOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleTextGradientApply = useCallback(() => {
    if (selectedElement.type === 'text') {
      const updates = setTextFillGradient(selectedElement, gradientStartColor, gradientEndColor, gradientAngle)
      onUpdateElement(updates)
    }
    setTextBackgroundOpen(false)
  }, [selectedElement, gradientStartColor, gradientEndColor, gradientAngle, onUpdateElement])

  const handleClearTextBackground = useCallback(() => {
    if (selectedElement.type === 'text') {
      const updates = clearTextFill(selectedElement)
      onUpdateElement(updates)
    }
  }, [selectedElement, onUpdateElement])

  const handleTextBorderColorChange = useCallback((color: string) => {
    if (selectedElement.type === 'text') {
      const width = selectedElement.border?.width || 1
      const updates = setTextBorder(selectedElement, color, width)
      onUpdateElement(updates)
    }
    setTextBorderColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleTextBorderWidthChange = useCallback((width: number) => {
    if (selectedElement.type === 'text') {
      if (width === 0) {
        const updates = clearTextBorder(selectedElement)
        onUpdateElement(updates)
      } else {
        const color = selectedElement.border?.color || '#000000'
        const updates = setTextBorder(selectedElement, color, width)
        onUpdateElement(updates)
      }
    }
  }, [selectedElement, onUpdateElement])

  const handleHighlightColorChange = useCallback((color: string) => {
    if (selectedElement.type === 'text' && textSelection) {
      const updates = addHighlight(selectedElement, textSelection.start, textSelection.end, color)
      onUpdateElement(updates)
    }
    setHighlightColorOpen(false)
  }, [selectedElement, textSelection, onUpdateElement])

  if (selectedElement.type !== 'text') {
    return null
  }

  return (
    <>
      <div className="w-px h-6 bg-border mx-1" />

      {/* Font Family */}
      <DropdownMenu open={fontDropdownOpen} onOpenChange={setFontDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="primary" size="xs" title="Font Family" className="min-w-[100px] justify-between">
            <span className="text-xs truncate">{selectedElement.fontFace || 'Arial'}</span>
            <ChevronDown size={14} className="ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          {['Arial', 'Times New Roman', 'Calibri', 'Georgia', 'Verdana', 'Courier New', 'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Tahoma'].map((font) => (
            <DropdownMenuItem key={font} onClick={() => handleFontFaceChange(font)}>
              <span style={{ fontFamily: font }}>{font}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Size */}
      <div className="flex items-center">
        <Button
          variant="primary"
          size="icon-xs"
          className="rounded-r-none border-r-0"
          onClick={handleFontSizeDecrement}
          title="Decrease Font Size"
        >
          <Minus size={12} />
        </Button>
        <input
          type="number"
          className="w-12 h-7 text-center text-sm border border-border bg-background"
          value={selectedElement.fontSize || 18}
          onChange={handleFontSizeChange}
          min={8}
          max={200}
        />
        <Button
          variant="primary"
          size="icon-xs"
          className="rounded-l-none border-l-0"
          onClick={handleFontSizeIncrement}
          title="Increase Font Size"
        >
          <Plus size={12} />
        </Button>
      </div>

      <Button
        variant="primary"
        size="icon-xs"
        className={selectedElement.bold ? 'bg-accent' : ''}
        onClick={handleToggleBold}
        title="Bold"
      >
        <Bold size={16} />
      </Button>
      <Button
        variant="primary"
        size="icon-xs"
        className={selectedElement.italic ? 'bg-accent' : ''}
        onClick={handleToggleItalic}
        title="Italic"
      >
        <Italic size={16} />
      </Button>

      <ColorPicker
        colorType="text"
        isOpen={textColorOpen}
        setIsOpen={setTextColorOpen}
        currentColor={toHexColor(selectedElement.color || '363636')}
        onColorChange={handleTextColorChange}
      />

      {/* Text Background with Solid/Gradient Tabs */}
      <Popover open={textBackgroundOpen} onOpenChange={setTextBackgroundOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="primary"
            size="icon-xs"
            title="Text Background"
          >
            <div className="relative">
              <PaintBucket size={16} />
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
                style={{ backgroundColor: fillStyleToColorString(selectedElement.textFill) || 'var(--background)' }}
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <Tabs value={textBackgroundTab} onValueChange={(v) => setTextBackgroundTab(v as 'solid' | 'gradient')}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="solid">Solid</TabsTrigger>
              <TabsTrigger value="gradient">Gradient</TabsTrigger>
            </TabsList>

            <TabsContent value="solid" className="space-y-3 mt-3">
              <div className="grid grid-cols-6 gap-1">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleTextBackgroundChange(color)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">Custom:</span>
                <input
                  type="color"
                  className="w-8 h-6 cursor-pointer border rounded"
                  value={fillStyleToColorString(selectedElement.textFill) || '#ffffff'}
                  onChange={(e) => handleTextBackgroundChange(e.target.value)}
                />
              </div>
              <Button
                onClick={handleClearTextBackground}
                variant="outline"
                size="xs"
                className="w-full"
              >
                Clear Background
              </Button>
            </TabsContent>

            <TabsContent value="gradient" className="space-y-3 mt-3">
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
              <Button onClick={handleTextGradientApply} className="w-full" size="xs">
                Apply Gradient
              </Button>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      {/* Text Border with Width */}
      <div className="flex items-center gap-0">
        <ColorPicker
          colorType="textBorder"
          isOpen={textBorderColorOpen}
          setIsOpen={setTextBorderColorOpen}
          currentColor={selectedElement.border?.color || '#000000'}
          onColorChange={handleTextBorderColorChange}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="primary" size="xs" title="Border Width" className="min-w-[60px] ml-1 justify-between">
              <span className="text-xs">{selectedElement.border?.width ?? 0}pt</span>
              <ChevronDown size={14} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20].map((width) => (
              <DropdownMenuItem key={width} onClick={() => handleTextBorderWidthChange(width)}>
                <span className="text-xs">{width}pt</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ColorPicker
        colorType="highlight"
        isOpen={highlightColorOpen}
        setIsOpen={setHighlightColorOpen}
        currentColor="#ffff00"
        onColorChange={handleHighlightColorChange}
      />

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text Alignment Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="primary" size="xs" title="Text Alignment" className="gap-1">
            {selectedElement.align === 'left' && <AlignLeft size={16} />}
            {selectedElement.align === 'center' && <AlignCenter size={16} />}
            {selectedElement.align === 'right' && <AlignRight size={16} />}
            {!selectedElement.align && <AlignLeft size={16} />}
            <ChevronDown size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handleTextAlign('left')}>
            <AlignLeft size={16} className="mr-2" />
            Align Left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTextAlign('center')}>
            <AlignCenter size={16} className="mr-2" />
            Align Center
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTextAlign('right')}>
            <AlignRight size={16} className="mr-2" />
            Align Right
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleVerticalAlign('top')}>
            <AlignVerticalJustifyStart size={16} className="mr-2" />
            Align Top
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleVerticalAlign('middle')}>
            <AlignVerticalJustifyCenter size={16} className="mr-2" />
            Align Middle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleVerticalAlign('bottom')}>
            <AlignVerticalJustifyEnd size={16} className="mr-2" />
            Align Bottom
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
