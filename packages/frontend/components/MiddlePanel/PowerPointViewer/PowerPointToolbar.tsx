import { useState, useRef, useEffect, useCallback } from 'react'
import { SlideElement, Slide } from './PowerPointViewer'
import {
  createTextElement,
  createShapeElement,
  handleImageUpload,
  incrementFontSize,
  decrementFontSize,
  toHexColor,
  normalizeColor,
  createTableElement,
  addTableRow,
  removeTableRow,
  addTableColumn,
  removeTableColumn,
} from './handlers/powerpoint-toolbar-handlers'
import { Button } from '../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from '../../ui/popover'
import { BackgroundPanel, LayoutPanel, ThemePanel, TransitionPanel } from './SlideLayoutSelector'
import { SlideLayoutType, ThemeType, TransitionType } from './types/slide-layouts'
import {
  Undo,
  Redo,
  Type,
  Square,
  Image,
  Table,
  Trash2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Save,
  Download,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Paintbrush,
  PaintBucket,
  Layout,
  Columns,
  Rows,
} from 'lucide-react'
import { shapeCatalog, renderShapeSvg, getShapeDefinition, ShapeType } from './shape-catalog'

interface ToolbarButton {
  id: string
  title?: string
  icon?: JSX.Element
  onClick?: () => void
  disabled?: boolean
  isDivider?: boolean
  isDropdown?: boolean
  showWhen?: boolean
  isCustom?: boolean
  customType?: 'dimensions' | 'font-size'
  isColorPicker?: boolean
  colorType?: 'text' | 'fill' | 'stroke' | 'background' | 'tableBorder'
  active?: boolean
}

interface PowerPointToolbarProps {
  // Slide state
  slides: Slide[]
  currentSlideIndex: number
  currentSlide: Slide | undefined
  
  // Selected element
  selectedElement: SlideElement | null
  
  // Element handlers
  onAddElement: (element: SlideElement) => void
  onUpdateElement: (updates: Partial<SlideElement>) => void
  onDeleteElement: () => void
  
  // Slide handlers
  onAddSlide: () => void
  onDeleteSlide: () => void
  onUpdateSlideBackground: (background: string) => void
  onApplyLayout?: (layout: SlideLayoutType) => void
  onApplyTheme?: (theme: ThemeType) => void
  onApplyTransition?: (transition: TransitionType) => void
  onPreviousSlide: () => void
  onNextSlide: () => void
  
  // Undo/Redo
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  
  // Save/Download
  onSave: () => void
  onDownload: () => void
  saving: boolean
  hasUnsavedChanges: boolean
}

export function PowerPointToolbar({
  slides,
  currentSlideIndex,
  currentSlide,
  selectedElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onAddSlide,
  onDeleteSlide,
  onUpdateSlideBackground,
  onApplyLayout,
  onApplyTheme,
  onApplyTransition,
  onPreviousSlide,
  onNextSlide,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onDownload,
  saving,
  hasUnsavedChanges,
}: PowerPointToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [visibleButtons, setVisibleButtons] = useState<string[]>([])
  const [overflowOpen, setOverflowOpen] = useState(false)
  
  // Color picker states
  const [textColorOpen, setTextColorOpen] = useState(false)
  const [fillColorOpen, setFillColorOpen] = useState(false)
  const [strokeColorOpen, setStrokeColorOpen] = useState(false)
  const [backgroundColorOpen, setBackgroundColorOpen] = useState(false)
  const [tableBorderColorOpen, setTableBorderColorOpen] = useState(false)
  const [backgroundPanelOpen, setBackgroundPanelOpen] = useState(false)
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false)
  const [themePanelOpen, setThemePanelOpen] = useState(false)
  const [transitionPanelOpen, setTransitionPanelOpen] = useState(false)
  const canApplySlideSettings = Boolean(onApplyLayout && onApplyTheme && onApplyTransition)

  // Element action handlers
  const handleAddText = useCallback(() => {
    onAddElement(createTextElement())
  }, [onAddElement])

  const handleAddShape = useCallback((shapeType: ShapeType) => {
    onAddElement(createShapeElement(shapeType))
  }, [onAddElement])

  const handleAddImage = useCallback(() => {
    handleImageUpload((imageUrl) => {
      onAddElement({
        id: `image-${Date.now()}`,
        type: 'image',
        x: 10,
        y: 10,
        width: 40,
        height: 30,
        imageUrl,
      })
    })
  }, [onAddElement])

  const handleAddTable = useCallback(() => {
    onAddElement(createTableElement())
  }, [onAddElement])

  // Text formatting handlers
  const handleToggleBold = useCallback(() => {
    if (selectedElement?.type === 'text') {
      onUpdateElement({ bold: !selectedElement.bold })
    }
  }, [selectedElement, onUpdateElement])

  const handleToggleItalic = useCallback(() => {
    if (selectedElement?.type === 'text') {
      onUpdateElement({ italic: !selectedElement.italic })
    }
  }, [selectedElement, onUpdateElement])

  const handleFontSizeIncrement = useCallback(() => {
    if (selectedElement?.type === 'text') {
      const newSize = incrementFontSize(selectedElement.fontSize || 18)
      onUpdateElement({ fontSize: newSize })
    }
  }, [selectedElement, onUpdateElement])

  const handleFontSizeDecrement = useCallback(() => {
    if (selectedElement?.type === 'text') {
      const newSize = decrementFontSize(selectedElement.fontSize || 18)
      onUpdateElement({ fontSize: newSize })
    }
  }, [selectedElement, onUpdateElement])

  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElement?.type === 'text') {
      const size = parseInt(e.target.value) || 18
      onUpdateElement({ fontSize: Math.min(Math.max(size, 8), 200) })
    }
  }, [selectedElement, onUpdateElement])

  const handleTextAlign = useCallback((align: 'left' | 'center' | 'right') => {
    if (selectedElement?.type === 'text') {
      onUpdateElement({ align })
    }
  }, [selectedElement, onUpdateElement])

  const handleVerticalAlign = useCallback((valign: 'top' | 'middle' | 'bottom') => {
    if (selectedElement?.type === 'text') {
      onUpdateElement({ valign })
    }
  }, [selectedElement, onUpdateElement])

  const handleTextColorChange = useCallback((color: string) => {
    if (selectedElement?.type === 'text') {
      onUpdateElement({ color: normalizeColor(color) })
    }
    setTextColorOpen(false)
  }, [selectedElement, onUpdateElement])

  // Shape formatting handlers
  const handleFillColorChange = useCallback((color: string) => {
    if (selectedElement?.type === 'shape') {
      onUpdateElement({ fill: color })
    }
    setFillColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleStrokeColorChange = useCallback((color: string) => {
    if (selectedElement?.type === 'shape') {
      onUpdateElement({ stroke: color })
    }
    setStrokeColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElement?.type !== 'shape') return
    const width = Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
    onUpdateElement({ strokeWidth: width })
  }, [selectedElement, onUpdateElement])

  const handleRotationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElement?.type !== 'shape') return
    const rotation = Math.min(360, Math.max(0, parseInt(e.target.value) || 0))
    onUpdateElement({ rotation })
  }, [selectedElement, onUpdateElement])

  const handleShapeLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElement?.type !== 'shape') return
    onUpdateElement({ content: e.target.value })
  }, [selectedElement, onUpdateElement])

  // Slide background color handler
  const handleBackgroundColorChange = useCallback((color: string) => {
    onUpdateSlideBackground(color)
    setBackgroundColorOpen(false)
  }, [onUpdateSlideBackground])

  // Table formatting handlers
  const handleAddTableRow = useCallback(() => {
    if (selectedElement?.type === 'table') {
      const updated = addTableRow(selectedElement)
      if (updated) {
        onUpdateElement(updated)
      }
    }
  }, [selectedElement, onUpdateElement])

  const handleRemoveTableRow = useCallback(() => {
    if (selectedElement?.type === 'table' && selectedElement.rows && selectedElement.rows > 1) {
      const updated = removeTableRow(selectedElement)
      if (updated) {
        onUpdateElement(updated)
      }
    }
  }, [selectedElement, onUpdateElement])

  const handleAddTableColumn = useCallback(() => {
    if (selectedElement?.type === 'table') {
      const updated = addTableColumn(selectedElement)
      if (updated) {
        onUpdateElement(updated)
      }
    }
  }, [selectedElement, onUpdateElement])

  const handleRemoveTableColumn = useCallback(() => {
    if (selectedElement?.type === 'table' && selectedElement.columns && selectedElement.columns > 1) {
      const updated = removeTableColumn(selectedElement)
      if (updated) {
        onUpdateElement(updated)
      }
    }
  }, [selectedElement, onUpdateElement])

  const handleTableBorderColorChange = useCallback((color: string) => {
    if (selectedElement?.type === 'table') {
      onUpdateElement({ borderColor: color })
    }
    setTableBorderColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleToggleHeaderRow = useCallback(() => {
    if (selectedElement?.type === 'table') {
      onUpdateElement({ headerRow: !selectedElement.headerRow })
    }
  }, [selectedElement, onUpdateElement])

  // Dimension handlers
  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value) || 10
    onUpdateElement({ width: Math.min(Math.max(width, 1), 100) })
  }, [onUpdateElement])

  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value) || 10
    onUpdateElement({ height: Math.min(Math.max(height, 1), 100) })
  }, [onUpdateElement])

  // Color palette
  const colorPalette = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5',
    '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#C0CA33',
    '#FDD835', '#FB8C00', '#F4511E', '#6D4C41', '#78909C', '#455A64',
  ]

  // Toolbar button definitions
  const toolbarButtons: ToolbarButton[] = [
    { id: 'undo', title: 'Undo', icon: <Undo size={16} />, onClick: onUndo, disabled: !canUndo },
    { id: 'redo', title: 'Redo', icon: <Redo size={16} />, onClick: onRedo, disabled: !canRedo },
    { id: 'divider-1', isDivider: true },
    { id: 'text', title: 'Add Text', icon: <Type size={16} />, onClick: handleAddText },
    { id: 'shape', title: 'Add Shape', icon: <Square size={16} />, isDropdown: true },
    { id: 'image', title: 'Add Image', icon: <Image size={16} />, onClick: handleAddImage },
    { id: 'delete', title: 'Delete Element', icon: <Trash2 size={16} />, onClick: onDeleteElement, disabled: !selectedElement, showWhen: !!selectedElement },
  ]

  // Text formatting buttons (shown when text element selected)
  const textFormatButtons: ToolbarButton[] = selectedElement?.type === 'text' ? [
    { id: 'divider-text', isDivider: true },
    { id: 'font-size', title: 'Font Size', isCustom: true },
    { id: 'bold', title: 'Bold', icon: <Bold size={16} />, onClick: handleToggleBold, active: selectedElement?.bold },
    { id: 'italic', title: 'Italic', icon: <Italic size={16} />, onClick: handleToggleItalic, active: selectedElement?.italic },
    { id: 'text-color', title: 'Text Color', icon: <Paintbrush size={16} />, isColorPicker: true, colorType: 'text' },
    { id: 'divider-align', isDivider: true },
    { id: 'align-left', title: 'Align Left', icon: <AlignLeft size={16} />, onClick: () => handleTextAlign('left'), active: selectedElement?.align === 'left' },
    { id: 'align-center', title: 'Align Center', icon: <AlignCenter size={16} />, onClick: () => handleTextAlign('center'), active: selectedElement?.align === 'center' },
    { id: 'align-right', title: 'Align Right', icon: <AlignRight size={16} />, onClick: () => handleTextAlign('right'), active: selectedElement?.align === 'right' },
    { id: 'divider-valign', isDivider: true },
    { id: 'valign-top', title: 'Align Top', icon: <AlignVerticalJustifyStart size={16} />, onClick: () => handleVerticalAlign('top'), active: selectedElement?.valign === 'top' },
    { id: 'valign-middle', title: 'Align Middle', icon: <AlignVerticalJustifyCenter size={16} />, onClick: () => handleVerticalAlign('middle'), active: selectedElement?.valign === 'middle' },
    { id: 'valign-bottom', title: 'Align Bottom', icon: <AlignVerticalJustifyEnd size={16} />, onClick: () => handleVerticalAlign('bottom'), active: selectedElement?.valign === 'bottom' },
  ] : []

  // Shape formatting buttons (shown when shape element selected)
  const shapeFormatButtons: ToolbarButton[] = selectedElement?.type === 'shape' ? [
    { id: 'divider-shape', isDivider: true },
    { id: 'fill-color', title: 'Fill Color', icon: <PaintBucket size={16} />, isColorPicker: true, colorType: 'fill' },
    { id: 'stroke-color', title: 'Stroke Color', icon: <Paintbrush size={16} />, isColorPicker: true, colorType: 'stroke' },
  ] : []

  // Dimension controls (shown when any element selected)
  const dimensionButtons: ToolbarButton[] = selectedElement ? [
    { id: 'divider-dim', isDivider: true },
    { id: 'dimensions', title: 'Dimensions', isCustom: true, customType: 'dimensions' },
  ] : []

  const allButtons: ToolbarButton[] = [...toolbarButtons, ...textFormatButtons, ...shapeFormatButtons, ...dimensionButtons]

  // Calculate visible buttons based on toolbar width
  const calculateVisible = useCallback(() => {
    const el = toolbarRef.current
    if (!el) {
      setVisibleButtons(allButtons.filter(b => !b.isDivider).map(b => b.id))
      return
    }
    const containerWidth = el.offsetWidth || 0
    if (containerWidth === 0) {
      setVisibleButtons(allButtons.filter(b => !b.isDivider).map(b => b.id))
      return
    }
    
    // Reserve space for right section (slide nav, save/download)
    const reserved = 320
    const overflowButtonWidth = 32
    const available = Math.max(0, containerWidth - reserved - overflowButtonWidth)
    const buttonWidth = 32
    const dividerWidth = 16

    let used = 0
    const visible: string[] = []
    for (const btn of allButtons) {
      if (btn.isDivider) {
        used += dividerWidth
        continue
      }
      const width = btn.isCustom ? (btn.customType === 'dimensions' ? 140 : 100) : buttonWidth
      if (used + width <= available) {
        visible.push(btn.id)
        used += width
      } else {
        break
      }
    }
    if (visible.length === 0) {
      setVisibleButtons(allButtons.slice(0, 5).filter(b => !b.isDivider).map(b => b.id))
    } else {
      setVisibleButtons(visible)
    }
  }, [allButtons])

  useEffect(() => {
    const fn = calculateVisible
    const t = setTimeout(fn, 50)
    const RO = typeof window !== 'undefined' ? (window as any).ResizeObserver : undefined
    const ro = RO ? new RO(() => setTimeout(fn, 50)) : null
    if (ro && toolbarRef.current) ro.observe(toolbarRef.current)
    const onResize = () => setTimeout(fn, 50)
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', onResize)
      if (ro) ro.disconnect()
    }
  }, [calculateVisible])

  // Render color picker dropdown
  const renderColorPicker = (colorType: 'text' | 'fill' | 'stroke' | 'background' | 'tableBorder', isOpen: boolean, setIsOpen: (open: boolean) => void, currentColor: string) => (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="icon-sm"
          title={colorType === 'text' ? 'Text Color' : colorType === 'fill' ? 'Fill Color' : colorType === 'stroke' ? 'Stroke Color' : 'Background Color'}
        >
          <div className="relative">
            {colorType === 'text' || colorType === 'stroke' ? <Paintbrush size={16} /> : <PaintBucket size={16} />}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1 rounded-full" 
              style={{ backgroundColor: currentColor }}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-2">
        <div className="grid grid-cols-6 gap-1">
          {colorPalette.map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => {
                if (colorType === 'text') handleTextColorChange(color)
                else if (colorType === 'fill') handleFillColorChange(color)
                else if (colorType === 'stroke') handleStrokeColorChange(color)
                else if (colorType === 'tableBorder') handleTableBorderColorChange(color)
                else handleBackgroundColorChange(color)
              }}
            />
          ))}
        </div>
        <DropdownMenuSeparator className="my-2" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Custom:</span>
          <input
            type="color"
            className="w-8 h-6 cursor-pointer border rounded"
            value={currentColor}
            onChange={(e) => {
              if (colorType === 'text') handleTextColorChange(e.target.value)
              else if (colorType === 'fill') handleFillColorChange(e.target.value)
              else if (colorType === 'stroke') handleStrokeColorChange(e.target.value)
              else if (colorType === 'tableBorder') handleTableBorderColorChange(e.target.value)
              else handleBackgroundColorChange(e.target.value)
            }}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div ref={toolbarRef} className="flex bg-accent items-center px-3 py-2 gap-1 border-b">
      {/* Left Section - Element Tools & Formatting */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {/* Undo/Redo */}
        <Button variant="primary" size="icon-sm" onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo size={16} />
        </Button>
        <Button variant="primary" size="icon-sm" onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo size={16} />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Slide Creation */}
        <Button variant="primary" size="icon-sm" onClick={onAddSlide} title="Add Slide">
          <Plus size={16} />
        </Button>
        <Button
          variant="primary"
          size="icon-sm"
          onClick={onDeleteSlide}
          disabled={slides.length <= 1}
          title="Delete Slide"
        >
          <Trash2 size={16} />
        </Button>
        {currentSlide && renderColorPicker(
          'background',
          backgroundColorOpen,
          setBackgroundColorOpen,
          currentSlide.background || '#ffffff'
        )}

        {canApplySlideSettings && (
          <>
            <Popover open={backgroundPanelOpen} onOpenChange={setBackgroundPanelOpen}>
              <PopoverTrigger asChild>
                <Button variant="primary" size="icon-sm" title="Background">
                  <PaintBucket size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 max-w-[600px]" align="start">
                <BackgroundPanel
                  currentBackground={currentSlide?.background}
                  onApplyBackground={(background) => {
                    onUpdateSlideBackground(background)
                    setBackgroundPanelOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>

            <Popover open={layoutPanelOpen} onOpenChange={setLayoutPanelOpen}>
              <PopoverTrigger asChild>
                <Button variant="primary" size="icon-sm" title="Layout">
                  <Layout size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 max-w-[600px]" align="start">
                <LayoutPanel
                  currentLayout={currentSlide?.layout}
                  onApplyLayout={(layout) => {
                    onApplyLayout?.(layout)
                    setLayoutPanelOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>

            <Popover open={themePanelOpen} onOpenChange={setThemePanelOpen}>
              <PopoverTrigger asChild>
                <Button variant="primary" size="icon-sm" title="Theme">
                  <Paintbrush size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 max-w-[600px]" align="start">
                <ThemePanel
                  currentTheme={currentSlide?.theme}
                  onApplyTheme={(theme) => {
                    onApplyTheme?.(theme)
                    setThemePanelOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>

            <Popover open={transitionPanelOpen} onOpenChange={setTransitionPanelOpen}>
              <PopoverTrigger asChild>
                <Button variant="primary" size="icon-sm" title="Transition">
                  <RefreshCw size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 max-w-[600px]" align="start">
                <TransitionPanel
                  currentTransition={currentSlide?.transition}
                  onApplyTransition={(transition) => {
                    onApplyTransition?.(transition)
                    setTransitionPanelOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Element Creation */}
        <Button variant="primary" size="icon-sm" onClick={handleAddText} title="Add Text">
          <Type size={16} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="primary" size="icon-sm" title="Add Shape">
              <Square size={17} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={4} className="w-[352px] max-h-[320px] overflow-y-auto p-2">
            <div className="grid grid-cols-8 gap-1 justify-items-center">
              {shapeCatalog.map((shape) => (
                <DropdownMenuItem key={shape.id} className="p-0" asChild>
                  <button
                    type="button"
                    aria-label={shape.label}
                    title={shape.label}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background hover:bg-accent transition-colors"
                    onClick={() => handleAddShape(shape.id)}
                  >
                    <div className="h-7 w-7 text-primary">
                      {renderShapeSvg(shape.id, { fill: 'currentColor', stroke: 'currentColor', strokeWidth: 2, text: shape.defaultText })}
                    </div>
                  </button>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="primary" size="icon-sm" onClick={handleAddImage} title="Add Image">
          <Image size={16} />
        </Button>

        <Button variant="primary" size="icon-sm" onClick={handleAddTable} title="Add Table">
          <Table size={16} />
        </Button>

        {selectedElement && (
          <Button 
            variant="primary" 
            size="icon-sm"
            className="text-destructive hover:text-destructive" 
            onClick={onDeleteElement} 
            title="Delete Element"
          >
            <Trash2 size={16} />
          </Button>
        )}

        {/* Text Formatting - shown when text element selected */}
        {selectedElement?.type === 'text' && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Font Size */}
            <div className="flex items-center">
              <Button
                variant="primary"
                size="icon-sm"
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
                size="icon-sm"
                className="rounded-l-none border-l-0"
                onClick={handleFontSizeIncrement}
                title="Increase Font Size"
              >
                <Plus size={12} />
              </Button>
            </div>

            <Button
              variant="primary"
              size="icon-sm"
              className={selectedElement.bold ? 'bg-accent' : ''}
              onClick={handleToggleBold}
              title="Bold"
            >
              <Bold size={16} />
            </Button>
            <Button
              variant="primary"
              size="icon-sm"
              className={selectedElement.italic ? 'bg-accent' : ''}
              onClick={handleToggleItalic}
              title="Italic"
            >
              <Italic size={16} />
            </Button>

            {renderColorPicker('text', textColorOpen, setTextColorOpen, toHexColor(selectedElement.color || '363636'))}

            <div className="w-px h-6 bg-border mx-1" />

            {/* Text Alignment */}
            <Button
              variant="primary"
              size="icon-sm"
              className={selectedElement.align === 'left' ? 'bg-accent' : ''}
              onClick={() => handleTextAlign('left')}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </Button>
            <Button
              variant="primary"
              size="icon-sm"
              className={selectedElement.align === 'center' ? 'bg-accent' : ''}
              onClick={() => handleTextAlign('center')}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </Button>
            <Button
              variant="primary"
              size="icon-sm"
              className={selectedElement.align === 'right' ? 'bg-accent' : ''}
              onClick={() => handleTextAlign('right')}
              title="Align Right"
            >
              <AlignRight size={16} />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Vertical Alignment */}
            <Button
              variant="primary"
              size="icon-sm"
              className={selectedElement.valign === 'top' ? 'bg-accent' : ''}
              onClick={() => handleVerticalAlign('top')}
              title="Align Top"
            >
              <AlignVerticalJustifyStart size={16} />
            </Button>
            <Button
              variant="primary"
              size="icon-sm"
              className={selectedElement.valign === 'middle' ? 'bg-accent' : ''}
              onClick={() => handleVerticalAlign('middle')}
              title="Align Middle"
            >
              <AlignVerticalJustifyCenter size={16} />
            </Button>
            <Button
              variant="primary"
              size="icon-sm"
              className={selectedElement.valign === 'bottom' ? 'bg-accent' : ''}
              onClick={() => handleVerticalAlign('bottom')}
              title="Align Bottom"
            >
              <AlignVerticalJustifyEnd size={16} />
            </Button>
          </>
        )}

        {/* Shape Formatting - shown when shape element selected */}
        {selectedElement?.type === 'shape' && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            
            {renderColorPicker('fill', fillColorOpen, setFillColorOpen, selectedElement.fill || '#4a90d9')}
            {renderColorPicker('stroke', strokeColorOpen, setStrokeColorOpen, selectedElement.stroke || '#2d5a8c')}

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
        )}

        {/* Table Formatting - shown when table element selected */}
        {selectedElement?.type === 'table' && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            
            <Button
              variant="primary"
              size="icon-sm"
              onClick={handleAddTableRow}
              title="Add Row"
            >
              <Plus size={16} />
            </Button>
            <Button
              variant="primary"
              size="icon-sm"
              onClick={handleRemoveTableRow}
              disabled={!selectedElement.rows || selectedElement.rows <= 1}
              title="Remove Row"
            >
              <Minus size={16} />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <Button
              variant="primary"
              size="icon-sm"
              onClick={handleAddTableColumn}
              title="Add Column"
            >
              <Columns size={16} />
            </Button>
            <Button
              variant="primary"
              size="icon-sm"
              onClick={handleRemoveTableColumn}
              disabled={!selectedElement.columns || selectedElement.columns <= 1}
              title="Remove Column"
            >
              <Minus size={16} />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {renderColorPicker(
              'tableBorder',
              tableBorderColorOpen,
              setTableBorderColorOpen,
              selectedElement.borderColor || '#cccccc'
            )}
            
            <Button
              variant="primary"
              size="icon-sm"
              className={selectedElement.headerRow ? 'bg-accent' : ''}
              onClick={handleToggleHeaderRow}
              title="Toggle Header Row"
            >
              <Rows size={16} />
            </Button>
          </>
        )}

        {/* Dimension Controls - shown for any selected element */}
        {selectedElement && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">W:</span>
              <input
                type="number"
                className="w-12 h-7 text-center text-xs border border-border rounded bg-background"
                value={Math.round(selectedElement.width)}
                onChange={handleWidthChange}
                min={1}
                max={100}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">H:</span>
              <input
                type="number"
                className="w-12 h-7 text-center text-xs border border-border rounded bg-background"
                value={Math.round(selectedElement.height)}
                onChange={handleHeightChange}
                min={1}
                max={100}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </>
        )}

        {/* Overflow menu for hidden buttons */}
        {visibleButtons.length < allButtons.filter(b => !b.isDivider).length && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <DropdownMenu open={overflowOpen} onOpenChange={setOverflowOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" title="More tools">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {allButtons
                  .filter(b => !b.isDivider && !visibleButtons.includes(b.id))
                  .map(btn => (
                    <DropdownMenuItem 
                      key={btn.id} 
                      onClick={() => { 
                        setOverflowOpen(false)
                        if (btn.onClick) btn.onClick()
                      }}
                      disabled={btn.disabled}
                    >
                      <span className="flex items-center gap-2">
                        {btn.icon}
                        {btn.title}
                      </span>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Right Section - Slide Navigation & Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap ml-2">
        <div className="w-px h-6 bg-border mx-2" />

        {/* Slide Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="primary"
            size="icon-sm"
            onClick={onPreviousSlide}
            disabled={currentSlideIndex === 0}
            title="Previous Slide"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <Button
            variant="primary"
            size="icon-sm"
            onClick={onNextSlide}
            disabled={currentSlideIndex >= slides.length - 1}
            title="Next Slide"
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Save & Download */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSave}
            disabled={saving || !hasUnsavedChanges}
            title="Save"
          >
            {saving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDownload}
            title="Download"
          >
            <Download size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PowerPointToolbar

