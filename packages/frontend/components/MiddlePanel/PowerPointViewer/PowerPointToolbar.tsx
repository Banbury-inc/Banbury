import { useState, useRef, useEffect, useCallback } from 'react'
import { SlideElement, Slide, FillStyle } from './PowerPointViewer'
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
import {
  setTextFillSolid,
  setTextFillGradient,
  clearTextFill,
  setShapeFillSolid,
  setShapeFillGradient,
  setTextBorder,
  clearTextBorder,
  addHighlight,
  clearAllHighlights,
} from './handlers/advanced-format-handlers'
import { fillStyleToColorString } from './utils/fill-utils'
import {
  handleLocalImageUpload,
  resolveWebImageToDataUrl,
  resolveDriveImageToDataUrl,
} from './handlers/powerpoint-image-handlers'
import { Button } from '../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from '../../ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { ApiService } from '../../../../backend/api/apiService'
import type { DriveFile } from '../../../../backend/api/drive/drive'
import { BackgroundPanel, LayoutPanel, ThemePanel, TransitionPanel, TemplatePanel } from './SlideLayoutSelector'
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
  Share2,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Paintbrush,
  PaintBucket,
  Layout,
  Columns,
  Rows,
  Link,
  Upload,
  Cloud,
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
  customType?: 'dimensions' | 'font-size' | 'font-family'
  isColorPicker?: boolean
  colorType?: 'text' | 'fill' | 'stroke' | 'background' | 'tableBorder' | 'textBackground' | 'textBorder' | 'highlight'
  active?: boolean
}

interface PowerPointToolbarProps {
  // Slide state
  slides: Slide[]
  currentSlideIndex: number
  currentSlide: Slide | undefined
  
  // Selected element
  selectedElement: SlideElement | null
  textSelection?: { start: number; end: number } | null
  
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
  onApplyTemplate?: (templateId: string) => void
  onApplyTransition?: (transition: TransitionType) => void
  onPreviousSlide: () => void
  onNextSlide: () => void
  
  // Undo/Redo
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  
  // Save/Download/Share
  onSave: () => void
  onDownload: () => void
  onShare?: () => void
  saving: boolean
  hasUnsavedChanges: boolean
  
  // Current template ID (optional)
  currentTemplateId?: string
}

export function PowerPointToolbar({
  slides,
  currentSlideIndex,
  currentSlide,
  selectedElement,
  textSelection: textSelectionProp,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onAddSlide,
  onDeleteSlide,
  onUpdateSlideBackground,
  onApplyLayout,
  onApplyTheme,
  onApplyTemplate,
  onApplyTransition,
  onPreviousSlide,
  onNextSlide,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onDownload,
  onShare,
  saving,
  hasUnsavedChanges,
  currentTemplateId,
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
  const [textBackgroundOpen, setTextBackgroundOpen] = useState(false)
  const [textBorderColorOpen, setTextBorderColorOpen] = useState(false)
  const [highlightColorOpen, setHighlightColorOpen] = useState(false)
  const [backgroundPanelOpen, setBackgroundPanelOpen] = useState(false)
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false)
  const [themePanelOpen, setThemePanelOpen] = useState(false)
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false)
  const [transitionPanelOpen, setTransitionPanelOpen] = useState(false)
  const canApplySlideSettings = Boolean(onApplyLayout && onApplyTheme && onApplyTransition)
  
  // Font selection
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false)
  
  // Use text selection from props (passed from PowerPointViewer)
  const textSelection = textSelectionProp
  
  // Gradient dialog states
  const [shapeGradientOpen, setShapeGradientOpen] = useState(false)
  
  // Gradient state
  const [gradientStartColor, setGradientStartColor] = useState('#ffffff')
  const [gradientEndColor, setGradientEndColor] = useState('#000000')
  const [gradientAngle, setGradientAngle] = useState(90)
  
  // Text background tab state
  const [textBackgroundTab, setTextBackgroundTab] = useState<'solid' | 'gradient'>('solid')
  
  // Image insertion dialogs
  const [urlImageDialogOpen, setUrlImageDialogOpen] = useState(false)
  const [driveImageDialogOpen, setDriveImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [driveImages, setDriveImages] = useState<DriveFile[]>([])
  const [driveLoading, setDriveLoading] = useState(false)

  // Element action handlers
  const handleAddText = useCallback(() => {
    onAddElement(createTextElement())
  }, [onAddElement])

  const handleAddShape = useCallback((shapeType: ShapeType) => {
    onAddElement(createShapeElement(shapeType))
  }, [onAddElement])

  // Image insertion handlers
  const handleAddImageFromComputer = useCallback(async () => {
    try {
      const dataUrl = await handleLocalImageUpload()
      onAddElement({
        id: `image-${Date.now()}`,
        type: 'image',
        x: 10,
        y: 10,
        width: 40,
        height: 30,
        imageUrl: dataUrl,
      })
    } catch (error) {
      // User cancelled or error occurred
      console.error('Image upload error:', error)
    }
  }, [onAddElement])

  const handleAddImageFromUrl = useCallback(async () => {
    if (!imageUrl.trim()) return
    
    setImageLoading(true)
    try {
      const dataUrl = await resolveWebImageToDataUrl(imageUrl.trim())
      onAddElement({
        id: `image-${Date.now()}`,
        type: 'image',
        x: 10,
        y: 10,
        width: 40,
        height: 30,
        imageUrl: dataUrl,
      })
      setUrlImageDialogOpen(false)
      setImageUrl('')
    } catch (error: any) {
      alert(error?.message || 'Failed to load image from URL')
    } finally {
      setImageLoading(false)
    }
  }, [imageUrl, onAddElement])

  const handleAddImageFromDrive = useCallback(async (fileId: string) => {
    setImageLoading(true)
    try {
      const dataUrl = await resolveDriveImageToDataUrl(fileId)
      onAddElement({
        id: `image-${Date.now()}`,
        type: 'image',
        x: 10,
        y: 10,
        width: 40,
        height: 30,
        imageUrl: dataUrl,
      })
      setDriveImageDialogOpen(false)
    } catch (error: any) {
      alert(error?.message || 'Failed to load image from Google Drive')
    } finally {
      setImageLoading(false)
    }
  }, [onAddElement])

  // Load Drive images when dialog opens
  useEffect(() => {
    if (driveImageDialogOpen && driveImages.length === 0) {
      setDriveLoading(true)
      ApiService.Drive.listFiles({
        q: "mimeType contains 'image/' and trashed = false",
        pageSize: 50,
        orderBy: 'modifiedTime desc'
      })
        .then(response => {
          setDriveImages(response.files || [])
        })
        .catch(error => {
          console.error('Failed to load Drive images:', error)
        })
        .finally(() => {
          setDriveLoading(false)
        })
    }
  }, [driveImageDialogOpen, driveImages.length])

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
      const updates = setShapeFillSolid(selectedElement, color)
      onUpdateElement(updates)
    }
    setFillColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleShapeGradientApply = useCallback(() => {
    if (selectedElement?.type === 'shape') {
      const updates = setShapeFillGradient(selectedElement, gradientStartColor, gradientEndColor, gradientAngle)
      onUpdateElement(updates)
    }
    setShapeGradientOpen(false)
  }, [selectedElement, gradientStartColor, gradientEndColor, gradientAngle, onUpdateElement])

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

  // Advanced formatting handlers
  const handleFontFaceChange = useCallback((fontFace: string) => {
    if (selectedElement?.type === 'text') {
      onUpdateElement({ fontFace })
    }
    setFontDropdownOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleTextBackgroundChange = useCallback((color: string) => {
    if (selectedElement?.type === 'text') {
      const updates = setTextFillSolid(selectedElement, color)
      onUpdateElement(updates)
    }
    setTextBackgroundOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleTextGradientApply = useCallback(() => {
    if (selectedElement?.type === 'text') {
      const updates = setTextFillGradient(selectedElement, gradientStartColor, gradientEndColor, gradientAngle)
      onUpdateElement(updates)
    }
    setTextBackgroundOpen(false)
  }, [selectedElement, gradientStartColor, gradientEndColor, gradientAngle, onUpdateElement])

  const handleClearTextBackground = useCallback(() => {
    if (selectedElement?.type === 'text') {
      const updates = clearTextFill(selectedElement)
      onUpdateElement(updates)
    }
  }, [selectedElement, onUpdateElement])

  const handleTextBorderColorChange = useCallback((color: string) => {
    if (selectedElement?.type === 'text') {
      const width = selectedElement.border?.width || 1
      const updates = setTextBorder(selectedElement, color, width)
      onUpdateElement(updates)
    }
    setTextBorderColorOpen(false)
  }, [selectedElement, onUpdateElement])

  const handleTextBorderWidthChange = useCallback((width: number) => {
    if (selectedElement?.type === 'text') {
      const color = selectedElement.border?.color || '#000000'
      const updates = setTextBorder(selectedElement, color, width)
      onUpdateElement(updates)
    }
  }, [selectedElement, onUpdateElement])

  const handleClearTextBorder = useCallback(() => {
    if (selectedElement?.type === 'text') {
      const updates = clearTextBorder(selectedElement)
      onUpdateElement(updates)
    }
  }, [selectedElement, onUpdateElement])

  const handleHighlightColorChange = useCallback((color: string) => {
    if (selectedElement?.type === 'text' && textSelection) {
      const updates = addHighlight(selectedElement, textSelection.start, textSelection.end, color)
      onUpdateElement(updates)
    }
    setHighlightColorOpen(false)
  }, [selectedElement, textSelection, onUpdateElement])

  const handleClearHighlights = useCallback(() => {
    if (selectedElement?.type === 'text') {
      const updates = clearAllHighlights(selectedElement)
      onUpdateElement(updates)
    }
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
    { id: 'image', title: 'Add Image', icon: <Image size={16} />, isDropdown: true },
    { id: 'delete', title: 'Delete Element', icon: <Trash2 size={16} />, onClick: onDeleteElement, disabled: !selectedElement, showWhen: !!selectedElement },
  ]

  // Text formatting buttons (shown when text element selected)
  const textFormatButtons: ToolbarButton[] = selectedElement?.type === 'text' ? [
    { id: 'divider-text', isDivider: true },
    { id: 'font-family', title: 'Font Family', isCustom: true, customType: 'font-family' },
    { id: 'font-size', title: 'Font Size', isCustom: true },
    { id: 'bold', title: 'Bold', icon: <Bold size={16} />, onClick: handleToggleBold, active: selectedElement?.bold },
    { id: 'italic', title: 'Italic', icon: <Italic size={16} />, onClick: handleToggleItalic, active: selectedElement?.italic },
    { id: 'text-color', title: 'Text Color', icon: <Paintbrush size={16} />, isColorPicker: true, colorType: 'text' },
    { id: 'text-background', title: 'Text Background', isColorPicker: true, colorType: 'textBackground' },
    { id: 'text-border', title: 'Text Border', isColorPicker: true, colorType: 'textBorder' },
    { id: 'highlight', title: 'Highlight', isColorPicker: true, colorType: 'highlight' },
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
  const renderColorPicker = (colorType: 'text' | 'fill' | 'stroke' | 'background' | 'tableBorder' | 'textBackground' | 'textBorder' | 'highlight', isOpen: boolean, setIsOpen: (open: boolean) => void, currentColor: string) => (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="icon-xs"
          title={
            colorType === 'text' ? 'Text Color' : 
            colorType === 'fill' ? 'Fill Color' : 
            colorType === 'stroke' ? 'Stroke Color' : 
            colorType === 'textBackground' ? 'Text Background' :
            colorType === 'textBorder' ? 'Text Border' :
            colorType === 'highlight' ? 'Highlight' :
            'Background Color'
          }
        >
          <div className="relative">
            {colorType === 'text' || colorType === 'stroke' || colorType === 'textBorder' ? <Paintbrush size={16} /> : <PaintBucket size={16} />}
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
                else if (colorType === 'textBackground') handleTextBackgroundChange(color)
                else if (colorType === 'textBorder') handleTextBorderColorChange(color)
                else if (colorType === 'highlight') handleHighlightColorChange(color)
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
              else if (colorType === 'textBackground') handleTextBackgroundChange(e.target.value)
              else if (colorType === 'textBorder') handleTextBorderColorChange(e.target.value)
              else if (colorType === 'highlight') handleHighlightColorChange(e.target.value)
              else handleBackgroundColorChange(e.target.value)
            }}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div ref={toolbarRef} className="flex bg-card items-center px-3 py-2 gap-1 border-b">
      {/* Left Section - Element Tools & Formatting */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {/* Undo/Redo */}
        <Button variant="primary" size="icon-xs" onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo size={16} />
        </Button>
        <Button variant="primary" size="icon-xs" onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo size={16} />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Slide Creation */}
        <Button variant="primary" size="icon-xs" onClick={onAddSlide} title="Add Slide">
          <Plus size={16} />
        </Button>
        <Button
          variant="primary"
          size="icon-xs"
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

            <Popover open={layoutPanelOpen} onOpenChange={setLayoutPanelOpen}>
              <PopoverTrigger asChild>
                <Button variant="primary" size="icon-xs" title="Layout">
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
                <Button variant="primary" size="icon-xs" title="Theme">
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
                <Button variant="primary" size="icon-xs" title="Transition">
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
        <Button variant="primary" size="icon-xs" onClick={handleAddText} title="Add Text">
          <Type size={16} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="primary" size="icon-xs" title="Add Shape">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="primary" size="icon-xs" title="Add Image">
              <Image size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleAddImageFromComputer}>
              <Upload size={16} className="mr-2" />
              Upload from Computer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUrlImageDialogOpen(true)}>
              <Link size={16} className="mr-2" />
              From URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDriveImageDialogOpen(true)}>
              <Cloud size={16} className="mr-2" />
              From Google Drive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="primary" size="icon-xs" onClick={handleAddTable} title="Add Table">
          <Table size={16} />
        </Button>

        {selectedElement && (
          <Button 
            variant="primary" 
            size="icon-xs"
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

            {renderColorPicker('text', textColorOpen, setTextColorOpen, toHexColor(selectedElement.color || '363636'))}
            
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
                      style={{ backgroundColor: fillStyleToColorString(selectedElement.textFill) || '#ffffff' }}
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
              {renderColorPicker('textBorder', textBorderColorOpen, setTextBorderColorOpen, selectedElement.border?.color || '#000000')}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="primary" size="xs" title="Border Width" className="min-w-[60px] ml-1 justify-between">
                    <span className="text-xs">{selectedElement.border?.width || 1}pt</span>
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
            
            {renderColorPicker('highlight', highlightColorOpen, setHighlightColorOpen, '#ffff00')}

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
        )}

        {/* Shape Formatting - shown when shape element selected */}
        {selectedElement?.type === 'shape' && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Shape Fill with Gradient */}
            <div className="flex items-center gap-0">
              {renderColorPicker('fill', fillColorOpen, setFillColorOpen, fillStyleToColorString(selectedElement.fill) || '#4a90d9')}
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
              size="icon-xs"
              onClick={handleAddTableRow}
              title="Add Row"
            >
              <Plus size={16} />
            </Button>
            <Button
              variant="primary"
              size="icon-xs"
              onClick={handleRemoveTableRow}
              disabled={!selectedElement.rows || selectedElement.rows <= 1}
              title="Remove Row"
            >
              <Minus size={16} />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <Button
              variant="primary"
              size="icon-xs"
              onClick={handleAddTableColumn}
              title="Add Column"
            >
              <Columns size={16} />
            </Button>
            <Button
              variant="primary"
              size="icon-xs"
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
              size="icon-xs"
              className={selectedElement.headerRow ? 'bg-accent' : ''}
              onClick={handleToggleHeaderRow}
              title="Toggle Header Row"
            >
              <Rows size={16} />
            </Button>
          </>
        )}


        {/* Overflow menu for hidden buttons */}
        {visibleButtons.length < allButtons.filter(b => !b.isDivider).length && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <DropdownMenu open={overflowOpen} onOpenChange={setOverflowOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" title="More tools">
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


        {/* Share, Save & Download */}
        <div className="flex items-center gap-1">
          {onShare && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onShare}
              title="Share"
            >
              <Share2 size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
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
            size="icon-xs"
            onClick={onDownload}
            title="Download"
          >
            <Download size={16} />
          </Button>
        </div>
      </div>

      {/* URL Image Dialog */}
      <Dialog open={urlImageDialogOpen} onOpenChange={setUrlImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image from URL</DialogTitle>
            <DialogDescription>
              Enter the URL of an image to add to your slide. The image will be embedded in the presentation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !imageLoading) {
                    handleAddImageFromUrl()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setUrlImageDialogOpen(false)
                setImageUrl('')
              }}
              disabled={imageLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddImageFromUrl}
              disabled={!imageUrl.trim() || imageLoading}
            >
              {imageLoading ? 'Loading...' : 'Add Image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Drive Image Dialog */}
      <Dialog open={driveImageDialogOpen} onOpenChange={setDriveImageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Image from Google Drive</DialogTitle>
            <DialogDescription>
              Select an image from your Google Drive to add to your slide.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {driveLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : driveImages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No images found in Google Drive
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {driveImages.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleAddImageFromDrive(file.id)}
                    disabled={imageLoading}
                    className="relative aspect-square rounded-lg border-2 border-border hover:border-primary transition-colors overflow-hidden bg-muted disabled:opacity-50"
                  >
                    {file.thumbnailLink ? (
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={32} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-xs truncate">
                      {file.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDriveImageDialogOpen(false)}
              disabled={imageLoading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PowerPointToolbar

