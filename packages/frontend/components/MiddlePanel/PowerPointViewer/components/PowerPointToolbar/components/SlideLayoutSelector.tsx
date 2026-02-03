import { useState, useEffect } from 'react'
import { SlideLayoutType, ThemeType, TransitionType, layoutTemplates, themes, Theme, getThemeBackgroundColor, getThemeTextColor, getThemeAccentColor } from '../../../types/slide-layouts'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../../common/ui/tabs'
import { cn } from '../../../../../../lib/utils'
import { getThemeService } from '../../../services/theme-service'
import { fillStyleToCSS, normalizeFill } from '../../../utils/fill-utils'
import { Input } from '../../../../../common/ui/input'
import { Search, Loader2 } from 'lucide-react'

const colorPalette = [
  '#ffffff', '#f5f5f5', '#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575',
  '#616161', '#424242', '#212121', '#000000',
  '#ffebee', '#fce4ec', '#f3e5f5', '#ede7f6', '#e8eaf6', '#e3f2fd',
  '#e0f2f1', '#e8f5e9', '#f1f8e9', '#f9fbe7', '#fffde7', '#fff8e1',
  '#fff3e0', '#fbe9d0', '#efebe9', '#fafafa', '#eceff1',
]

const transitions: { id: TransitionType; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'fade', name: 'Fade' },
  { id: 'slide', name: 'Slide' },
  { id: 'slide-up', name: 'Slide Up' },
  { id: 'slide-down', name: 'Slide Down' },
  { id: 'slide-left', name: 'Slide Left' },
  { id: 'slide-right', name: 'Slide Right' },
  { id: 'zoom', name: 'Zoom' },
  { id: 'dissolve', name: 'Dissolve' },
]

interface BackgroundPanelProps {
  currentBackground?: string
  onApplyBackground: (background: string) => void
}

export function BackgroundPanel({ currentBackground, onApplyBackground }: BackgroundPanelProps) {
  return (
    <div className="w-[600px] max-h-[500px] flex flex-col overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Background Color</h3>
          <div className="grid grid-cols-6 gap-2">
            {colorPalette.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-10 h-10 rounded border-2 transition-all hover:scale-110",
                  currentBackground === color ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
                style={{ backgroundColor: color }}
                onClick={() => onApplyBackground(color)}
                title={color}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Custom:</span>
            <input
              type="color"
              className="w-12 h-8 cursor-pointer border rounded"
              value={currentBackground || '#ffffff'}
              onChange={(e) => onApplyBackground(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface LayoutPanelProps {
  currentLayout?: SlideLayoutType
  onApplyLayout: (layout: SlideLayoutType) => void
}

export function LayoutPanel({ currentLayout, onApplyLayout }: LayoutPanelProps) {
  return (
    <div className="w-[600px] max-h-[500px] overflow-y-auto">
      <div className="grid grid-cols-3 gap-3">
        {layoutTemplates.map((layout) => (
          <button
            key={layout.id}
            className={cn(
              "flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:border-primary/50",
              currentLayout === layout.id
                ? "border-primary ring-2 ring-primary/20 bg-accent"
                : "border-border"
            )}
            onClick={() => onApplyLayout(layout.id)}
          >
            <div className="w-full aspect-[16/9] mb-2 bg-background border border-border rounded overflow-hidden">
              <LayoutPreview layoutId={layout.id} />
            </div>
            <span className="text-xs font-medium text-center">{layout.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface ThemePanelProps {
  currentTheme?: ThemeType
  onApplyTheme: (theme: ThemeType) => void
}

const themeCategories = [
  'all',
  'business',
  'professional',
  'creative',
  'minimal',
  'dark',
  'colorful',
  'modern',
] as const

export function ThemePanel({ currentTheme, onApplyTheme }: ThemePanelProps) {
  const [allThemes, setAllThemes] = useState<Theme[]>(themes)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    async function loadThemes() {
      try {
        setLoading(true)
        const themeService = getThemeService()
        const themes = await themeService.getThemes()
        setAllThemes(themes)
      } catch (error) {
        console.error('Failed to load themes:', error)
        // Fallback to default themes
        setAllThemes(themes)
      } finally {
        setLoading(false)
      }
    }
    loadThemes()
  }, [])

  // Filter themes
  const filteredThemes = allThemes.filter(theme => {
    // Category filter
    if (selectedCategory !== 'all' && theme.metadata?.category !== selectedCategory) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const nameMatch = theme.name.toLowerCase().includes(query)
      const tagMatch = theme.metadata?.tags?.some(tag => tag.toLowerCase().includes(query))
      const descMatch = theme.metadata?.description?.toLowerCase().includes(query)
      if (!nameMatch && !tagMatch && !descMatch) {
        return false
      }
    }

    return true
  })

  if (loading) {
    return (
      <div className="w-[600px] max-h-[500px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-[600px] max-h-[500px] flex flex-col">
      {/* Search and filters */}
      <div className="p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {themeCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-accent"
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Themes grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredThemes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No themes found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredThemes.map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                isSelected={currentTheme === theme.id}
                onSelect={() => onApplyTheme(theme.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ThemePreviewCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: Theme
  isSelected: boolean
  onSelect: () => void
}) {
  const backgroundColor = getThemeBackgroundColor(theme)
  const accentColor = getThemeAccentColor(theme)
  const textColor = getThemeTextColor(theme)

  // Get background style for preview
  const backgroundStyle = theme.backgroundStyle
    ? fillStyleToCSS(normalizeFill(theme.backgroundStyle as any))
    : backgroundColor

  return (
    <button
      className={cn(
        "flex flex-col items-start p-3 rounded-lg border-2 transition-all hover:border-primary/50",
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-accent"
          : "border-border"
      )}
      onClick={onSelect}
    >
      {/* Preview with gradient/decorative elements */}
      <div
        className="w-full h-20 mb-2 rounded overflow-hidden relative"
        style={{ background: backgroundStyle }}
      >
        {/* Decorative elements preview */}
        {theme.decorativeElements && theme.decorativeElements.length > 0 && (
          <div className="absolute inset-0">
            {theme.decorativeElements.slice(0, 3).map((el) => (
              <div
                key={el.id}
                className="absolute"
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: el.width ? `${el.width}%` : '15%',
                  height: el.height ? `${el.height}%` : '15%',
                  opacity: el.opacity * 0.5, // Reduce opacity for preview
                  backgroundColor: el.color,
                  borderRadius: el.shape === 'circle' ? '50%' : el.shape === 'blob' ? '30%' : '0',
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-full">
        <span className="text-sm font-medium block">{theme.name}</span>
        {theme.metadata?.category && (
          <span className="text-xs text-muted-foreground mt-1 block capitalize">
            {theme.metadata.category}
          </span>
        )}
        <div className="flex gap-1 mt-2">
          <div
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: backgroundColor }}
            title="Background"
          />
          <div
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: textColor }}
            title="Text"
          />
          <div
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: accentColor }}
            title="Accent"
          />
        </div>
      </div>
    </button>
  )
}

interface TransitionPanelProps {
  currentTransition?: TransitionType
  onApplyTransition: (transition: TransitionType) => void
}

export function TransitionPanel({ currentTransition, onApplyTransition }: TransitionPanelProps) {
  return (
    <div className="w-[600px] max-h-[500px] overflow-y-auto">
      <div className="space-y-2">
        {transitions.map((transition) => (
          <button
            key={transition.id}
            className={cn(
              "w-full text-left px-4 py-2 rounded-lg border-2 transition-all hover:border-primary/50",
              currentTransition === transition.id
                ? "border-primary ring-2 ring-primary/20 bg-accent"
                : "border-border"
            )}
            onClick={() => onApplyTransition(transition.id)}
          >
            <span className="text-sm font-medium">{transition.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface SlideLayoutSelectorProps {
  currentLayout?: SlideLayoutType
  currentTheme?: ThemeType
  currentTransition?: TransitionType
  currentBackground?: string
  onApplyLayout: (layout: SlideLayoutType) => void
  onApplyTheme: (theme: ThemeType) => void
  onApplyTransition: (transition: TransitionType) => void
  onApplyBackground: (background: string) => void
}

export function SlideLayoutSelector({
  currentLayout,
  currentTheme,
  currentTransition,
  currentBackground,
  onApplyLayout,
  onApplyTheme,
  onApplyTransition,
  onApplyBackground,
}: SlideLayoutSelectorProps) {
  const [activeTab, setActiveTab] = useState('layout')

  return (
    <div className="w-[600px] max-h-[500px] flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="transition">Transition</TabsTrigger>
        </TabsList>

        <TabsContent value="background" className="flex-1 overflow-y-auto mt-4">
          <BackgroundPanel
            currentBackground={currentBackground}
            onApplyBackground={onApplyBackground}
          />
        </TabsContent>

        <TabsContent value="layout" className="flex-1 overflow-y-auto mt-4">
          <LayoutPanel currentLayout={currentLayout} onApplyLayout={onApplyLayout} />
        </TabsContent>

        <TabsContent value="theme" className="flex-1 overflow-y-auto mt-4">
          <ThemePanel currentTheme={currentTheme} onApplyTheme={onApplyTheme} />
        </TabsContent>

        <TabsContent value="transition" className="flex-1 overflow-y-auto mt-4">
          <TransitionPanel
            currentTransition={currentTransition}
            onApplyTransition={onApplyTransition}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Layout preview component
function LayoutPreview({ layoutId }: { layoutId: SlideLayoutType }) {
  const previewStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#ffffff',
    padding: '4px',
    fontSize: '6px',
  }

  switch (layoutId) {
    case 'title': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '10%',
              width: '80%',
              height: '15%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: '#666',
            }}
          >
            Title
          </div>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              width: '80%',
              height: '10%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6px',
              color: '#999',
            }}
          >
            Subtitle
          </div>
        </div>
      )
    }

    case 'section-header': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '10%',
              width: '80%',
              height: '20%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: '#666',
            }}
          >
            Title
          </div>
        </div>
      )
    }

    case 'title-body': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '80%',
              height: '10%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '7px',
              color: '#666',
              paddingLeft: '4px',
            }}
          >
            Title
          </div>
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '10%',
              width: '80%',
              height: '60%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'flex-start',
              fontSize: '6px',
              color: '#999',
              paddingLeft: '4px',
              paddingTop: '4px',
            }}
          >
            Text
          </div>
        </div>
      )
    }

    case 'title-two-column': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '80%',
              height: '10%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '7px',
              color: '#666',
              paddingLeft: '4px',
            }}
          >
            Title
          </div>
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '10%',
              width: '38%',
              height: '60%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'flex-start',
              fontSize: '6px',
              color: '#999',
              paddingLeft: '4px',
              paddingTop: '4px',
            }}
          >
            Text
          </div>
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '52%',
              width: '38%',
              height: '60%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'flex-start',
              fontSize: '6px',
              color: '#999',
              paddingLeft: '4px',
              paddingTop: '4px',
            }}
          >
            Text
          </div>
        </div>
      )
    }

    case 'title-only': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '10%',
              width: '80%',
              height: '20%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: '#666',
            }}
          >
            Title
          </div>
        </div>
      )
    }

    case 'one-column-text': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '40%',
              height: '8%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '7px',
              color: '#666',
              paddingLeft: '4px',
            }}
          >
            Title
          </div>
          <div
            style={{
              position: 'absolute',
              top: '22%',
              left: '10%',
              width: '80%',
              height: '70%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'flex-start',
              fontSize: '6px',
              color: '#999',
              paddingLeft: '4px',
              paddingTop: '4px',
            }}
          >
            Text
          </div>
        </div>
      )
    }

    case 'main-point': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '10%',
              width: '80%',
              height: '30%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              color: '#666',
            }}
          >
            Title
          </div>
        </div>
      )
    }

    case 'section-title-description': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '45%',
              height: '10%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '7px',
              color: '#666',
              paddingLeft: '4px',
            }}
          >
            Title
          </div>
          <div
            style={{
              position: 'absolute',
              top: '22%',
              left: '10%',
              width: '45%',
              height: '8%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '6px',
              color: '#999',
              paddingLeft: '4px',
            }}
          >
            Subtitle
          </div>
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '58%',
              width: '32%',
              height: '75%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'flex-start',
              fontSize: '6px',
              color: '#999',
              paddingLeft: '4px',
              paddingTop: '4px',
            }}
          >
            Text
          </div>
        </div>
      )
    }

    case 'caption': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '80%',
              left: '10%',
              width: '80%',
              height: '15%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6px',
              color: '#999',
            }}
          >
            Text
          </div>
        </div>
      )
    }

    case 'big-number': {
      return (
        <div style={previewStyle}>
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '10%',
              width: '80%',
              height: '25%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#666',
              fontWeight: 'bold',
            }}
          >
            xx%
          </div>
          <div
            style={{
              position: 'absolute',
              top: '60%',
              left: '10%',
              width: '80%',
              height: '15%',
              border: '1px solid #ccc',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6px',
              color: '#999',
            }}
          >
            Text
          </div>
        </div>
      )
    }

    case 'blank':
    default: {
      return <div style={previewStyle} />
    }
  }
}

