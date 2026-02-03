import { useState, useRef, useEffect, useCallback } from 'react'
import { SlideElement, Slide, FillStyle } from '../../PowerPointViewer'
import {
  createTextElement,
  createShapeElement,
  createTableElement,
} from './handlers/powerpoint-toolbar-handlers'
import {
  handleLocalImageUpload,
  resolveWebImageToDataUrl,
  resolveDriveImageToDataUrl,
} from './handlers/powerpoint-image-handlers'
import { Button } from '../../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../../../common/ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from '../../../../common/ui/popover'
import { ApiService } from '../../../../../../backend/api/apiService'
import type { DriveFile } from '../../../../../../backend/api/drive/drive'
import { BackgroundPanel, LayoutPanel, ThemePanel, TransitionPanel } from './components/SlideLayoutSelector'
import { SlideLayoutType, ThemeType, TransitionType } from '../../types/slide-layouts'
import { ColorPicker } from './components/ColorPicker'
import { UrlImageDialog } from './components/UrlImageDialog'
import { DriveImageDialog } from './components/DriveImageDialog'
import { calculateVisibleButtons } from './utils/calculate-visible-buttons'
import { TextFormattingToolbar } from './components/TextFormattingToolbar'
import { ShapeFormattingToolbar } from './components/ShapeFormattingToolbar'
import { TableFormattingToolbar } from './components/TableFormattingToolbar'
import { SlideActionsToolbar } from './components/SlideActionsToolbar'
import {
  Undo,
  Redo,
  Type,
  Square,
  Image as ImageIcon,
  Table,
  Trash2,
  Plus,
  MoreHorizontal,
  Layout,
  Paintbrush,
  RefreshCw,
  Link,
  Upload,
  Cloud,
} from 'lucide-react'
import { shapeCatalog, renderShapeSvg, ShapeType } from '../shape-catalog'

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
  slides: Slide[]
  currentSlideIndex: number
  currentSlide: Slide | undefined
  selectedElement: SlideElement | null
  textSelection?: { start: number; end: number } | null
  onAddElement: (element: SlideElement) => void
  onUpdateElement: (updates: Partial<SlideElement>) => void
  onDeleteElement: () => void
  onAddSlide: () => void
  onDeleteSlide: () => void
  onUpdateSlideBackground: (background: string) => void
  onApplyLayout?: (layout: SlideLayoutType) => void
  onApplyTheme?: (theme: ThemeType) => void
  onApplyTemplate?: (templateId: string) => void
  onApplyTransition?: (transition: TransitionType) => void
  onPreviousSlide: () => void
  onNextSlide: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onSave: () => void
  onDownload: () => void
  onShare?: () => void
  onStartPresentation?: () => void
  saving: boolean
  hasUnsavedChanges: boolean
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
  onStartPresentation,
  saving,
  hasUnsavedChanges,
  currentTemplateId,
}: PowerPointToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [visibleButtons, setVisibleButtons] = useState<string[]>([])
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [backgroundColorOpen, setBackgroundColorOpen] = useState(false)
  const [backgroundPanelOpen, setBackgroundPanelOpen] = useState(false)
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false)
  const [themePanelOpen, setThemePanelOpen] = useState(false)
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false)
  const [transitionPanelOpen, setTransitionPanelOpen] = useState(false)
  const canApplySlideSettings = Boolean(onApplyLayout && onApplyTheme && onApplyTransition)
  const textSelection = textSelectionProp
  const [urlImageDialogOpen, setUrlImageDialogOpen] = useState(false)
  const [driveImageDialogOpen, setDriveImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [driveImages, setDriveImages] = useState<DriveFile[]>([])
  const [driveLoading, setDriveLoading] = useState(false)

  const handleAddText = useCallback(() => {
    onAddElement(createTextElement())
  }, [onAddElement])

  const handleAddShape = useCallback((shapeType: ShapeType) => {
    onAddElement(createShapeElement(shapeType))
  }, [onAddElement])

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

  const handleBackgroundColorChange = useCallback((color: string) => {
    onUpdateSlideBackground(color)
    setBackgroundColorOpen(false)
  }, [onUpdateSlideBackground])


  const toolbarButtons: ToolbarButton[] = [
    { id: 'undo', title: 'Undo', icon: <Undo size={16} />, onClick: onUndo, disabled: !canUndo },
    { id: 'redo', title: 'Redo', icon: <Redo size={16} />, onClick: onRedo, disabled: !canRedo },
    { id: 'divider-1', isDivider: true },
    { id: 'text', title: 'Add Text', icon: <Type size={16} />, onClick: handleAddText },
    { id: 'shape', title: 'Add Shape', icon: <Square size={16} />, isDropdown: true },
    { id: 'image', title: 'Add Image', icon: <ImageIcon size={16} />, isDropdown: true },
    { id: 'delete', title: 'Delete Element', icon: <Trash2 size={16} />, onClick: onDeleteElement, disabled: !selectedElement, showWhen: !!selectedElement },
  ]

  const allButtons: ToolbarButton[] = toolbarButtons

  const calculateVisible = useCallback(() => {
    const el = toolbarRef.current
    if (!el) {
      setVisibleButtons(allButtons.filter(b => !b.isDivider).map(b => b.id))
      return
    }
    const containerWidth = el.offsetWidth || 0
    
    const visible = calculateVisibleButtons({
      containerWidth,
      allButtons,
      reserved: 320,
      overflowButtonWidth: 32,
      buttonWidth: 32,
      dividerWidth: 16,
    })
    
    setVisibleButtons(visible)
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


  return (
    <div ref={toolbarRef} className="flex bg-card items-center px-3 py-2 gap-1 border-b">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Button variant="primary" size="icon-xs" onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo size={16} />
        </Button>
        <Button variant="primary" size="icon-xs" onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo size={16} />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

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
        {currentSlide && (
          <ColorPicker
            colorType="background"
            isOpen={backgroundColorOpen}
            setIsOpen={setBackgroundColorOpen}
            currentColor={currentSlide.background || '#ffffff'}
            onColorChange={handleBackgroundColorChange}
          />
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
              <ImageIcon size={16} />
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

        {selectedElement?.type === 'text' && (
          <TextFormattingToolbar
            selectedElement={selectedElement}
            textSelection={textSelection}
            onUpdateElement={onUpdateElement}
          />
        )}

        {selectedElement?.type === 'shape' && (
          <ShapeFormattingToolbar
            selectedElement={selectedElement}
            onUpdateElement={onUpdateElement}
          />
        )}

        {selectedElement?.type === 'table' && (
          <TableFormattingToolbar
            selectedElement={selectedElement}
            onUpdateElement={onUpdateElement}
          />
        )}


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

      <SlideActionsToolbar
        onSave={onSave}
        onDownload={onDownload}
        onShare={onShare}
        onStartPresentation={onStartPresentation}
        saving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <UrlImageDialog
        open={urlImageDialogOpen}
        onOpenChange={setUrlImageDialogOpen}
        imageUrl={imageUrl}
        onImageUrlChange={setImageUrl}
        onAddImage={handleAddImageFromUrl}
        loading={imageLoading}
      />

      <DriveImageDialog
        open={driveImageDialogOpen}
        onOpenChange={setDriveImageDialogOpen}
        driveImages={driveImages}
        loading={driveLoading}
        imageLoading={imageLoading}
        onAddImage={handleAddImageFromDrive}
      />
    </div>
  )
}

export default PowerPointToolbar

