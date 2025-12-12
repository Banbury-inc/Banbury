import { useState } from 'react'
import { SlideLayoutType, ThemeType, TransitionType, layoutTemplates, themes } from './types/slide-layouts'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { cn } from '../../../lib/utils'

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

export function ThemePanel({ currentTheme, onApplyTheme }: ThemePanelProps) {
  return (
    <div className="w-[600px] max-h-[500px] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={cn(
              "flex flex-col items-start p-3 rounded-lg border-2 transition-all hover:border-primary/50",
              currentTheme === theme.id
                ? "border-primary ring-2 ring-primary/20 bg-accent"
                : "border-border"
            )}
            onClick={() => onApplyTheme(theme.id)}
          >
            <div className="w-full h-16 mb-2 rounded overflow-hidden flex">
              <div className="flex-1" style={{ backgroundColor: theme.background }} />
              <div className="flex-1" style={{ backgroundColor: theme.accent }} />
              <div className="flex-1" style={{ backgroundColor: theme.secondary }} />
            </div>
            <span className="text-sm font-medium">{theme.name}</span>
            <div className="flex gap-1 mt-1">
              <div
                className="w-4 h-4 rounded border border-border"
                style={{ backgroundColor: theme.background }}
                title="Background"
              />
              <div
                className="w-4 h-4 rounded border border-border"
                style={{ backgroundColor: theme.text }}
                title="Text"
              />
              <div
                className="w-4 h-4 rounded border border-border"
                style={{ backgroundColor: theme.accent }}
                title="Accent"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
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

