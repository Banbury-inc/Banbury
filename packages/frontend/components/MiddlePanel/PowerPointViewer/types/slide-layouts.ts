export type SlideLayoutType =
  | 'title'
  | 'section-header'
  | 'title-body'
  | 'title-two-column'
  | 'title-only'
  | 'one-column-text'
  | 'main-point'
  | 'section-title-description'
  | 'caption'
  | 'big-number'
  | 'blank'
  | 'content'
  | 'twoColumn'

export type ThemeType =
  | 'default'
  | 'dark'
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'red'
  | 'minimal'
  | string // Allow string IDs for API-loaded themes

export type TransitionType =
  | 'none'
  | 'fade'
  | 'slide'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'dissolve'

// Background style types
export type BackgroundStyle = 
  | { kind: 'solid'; color: string }
  | { kind: 'linearGradient'; startColor: string; endColor: string; angleDeg: number }
  | { kind: 'radialGradient'; startColor: string; endColor: string; centerX?: number; centerY?: number }
  | { kind: 'pattern'; patternId: string; patternUrl?: string; baseColor?: string }

// Decorative element types
export type DecorativeShape = 'circle' | 'rect' | 'line' | 'triangle' | 'blob'

export interface DecorativeElement {
  id: string
  shape: DecorativeShape
  x: number // percentage
  y: number // percentage
  width?: number // percentage
  height?: number // percentage
  color: string
  opacity: number
  rotation?: number
  scale?: number
}

// Typography settings
export interface TypographySettings {
  titleFont?: string
  titleSize?: number
  titleWeight?: number | string
  bodyFont?: string
  bodySize?: number
  bodyWeight?: number | string
  accentFont?: string
  accentSize?: number
  accentWeight?: number | string
}

// Theme metadata
export interface ThemeMetadata {
  category?: 'business' | 'creative' | 'minimal' | 'dark' | 'colorful' | 'professional' | 'modern'
  tags?: string[]
  previewUrl?: string
  source?: string
  description?: string
}

// Enhanced Theme interface
export interface Theme {
  id: ThemeType
  name: string
  // Backward compatible simple properties
  background?: string
  text?: string
  accent?: string
  secondary?: string
  // Enhanced properties
  backgroundStyle?: BackgroundStyle
  colorPalette?: {
    primary: string
    secondary: string
    accent: string
    text: string
    textSecondary?: string
    background?: string
  }
  decorativeElements?: DecorativeElement[]
  typography?: TypographySettings
  metadata?: ThemeMetadata
}

// Helper function to get background color from theme (backward compatible)
export function getThemeBackgroundColor(theme: Theme): string {
  if (theme.background) {
    return theme.background
  }
  if (theme.backgroundStyle?.kind === 'solid') {
    return theme.backgroundStyle.color
  }
  if (theme.colorPalette?.background) {
    return theme.colorPalette.background
  }
  return '#ffffff'
}

// Helper function to get text color from theme (backward compatible)
export function getThemeTextColor(theme: Theme): string {
  if (theme.text) {
    return theme.text
  }
  if (theme.colorPalette?.text) {
    return theme.colorPalette.text
  }
  return '#363636'
}

// Helper function to get accent color from theme (backward compatible)
export function getThemeAccentColor(theme: Theme): string {
  if (theme.accent) {
    return theme.accent
  }
  if (theme.colorPalette?.accent) {
    return theme.colorPalette.accent
  }
  return '#4a90d9'
}

// Helper function to get secondary color from theme (backward compatible)
export function getThemeSecondaryColor(theme: Theme): string {
  if (theme.secondary) {
    return theme.secondary
  }
  if (theme.colorPalette?.secondary) {
    return theme.colorPalette.secondary
  }
  return '#e0e0e0'
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    background: '#ffffff',
    text: '#363636',
    accent: '#4a90d9',
    secondary: '#e0e0e0',
    metadata: {
      category: 'minimal',
      tags: ['clean', 'simple'],
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    background: '#1a1a1a',
    text: '#ffffff',
    accent: '#4a90d9',
    secondary: '#333333',
    metadata: {
      category: 'dark',
      tags: ['dark', 'modern'],
    },
  },
  {
    id: 'blue',
    name: 'Blue',
    background: '#f0f7ff',
    text: '#1a3a5f',
    accent: '#1e88e5',
    secondary: '#90caf9',
    metadata: {
      category: 'professional',
      tags: ['business', 'corporate'],
    },
  },
  {
    id: 'green',
    name: 'Green',
    background: '#f1f8e9',
    text: '#2e7d32',
    accent: '#43a047',
    secondary: '#a5d6a7',
    metadata: {
      category: 'business',
      tags: ['nature', 'growth'],
    },
  },
  {
    id: 'purple',
    name: 'Purple',
    background: '#f3e5f5',
    text: '#6a1b9a',
    accent: '#8e24aa',
    secondary: '#ce93d8',
    metadata: {
      category: 'creative',
      tags: ['creative', 'vibrant'],
    },
  },
  {
    id: 'orange',
    name: 'Orange',
    background: '#fff3e0',
    text: '#e65100',
    accent: '#fb8c00',
    secondary: '#ffb74d',
    metadata: {
      category: 'colorful',
      tags: ['warm', 'energetic'],
    },
  },
  {
    id: 'red',
    name: 'Red',
    background: '#ffebee',
    text: '#c62828',
    accent: '#e53935',
    secondary: '#ef9a9a',
    metadata: {
      category: 'colorful',
      tags: ['bold', 'attention'],
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    background: '#ffffff',
    text: '#000000',
    accent: '#000000',
    secondary: '#f5f5f5',
    metadata: {
      category: 'minimal',
      tags: ['minimalist', 'clean'],
    },
  },
]

export interface LayoutTemplate {
  id: SlideLayoutType
  name: string
  description: string
}

export const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'title',
    name: 'Title slide',
    description: 'Large title with subtitle',
  },
  {
    id: 'section-header',
    name: 'Section header',
    description: 'Centered section title',
  },
  {
    id: 'title-body',
    name: 'Title and body',
    description: 'Title with body text',
  },
  {
    id: 'title-two-column',
    name: 'Title and two columns',
    description: 'Title with two columns',
  },
  {
    id: 'title-only',
    name: 'Title only',
    description: 'Single centered title',
  },
  {
    id: 'one-column-text',
    name: 'One column text',
    description: 'Title with single column text',
  },
  {
    id: 'main-point',
    name: 'Main point',
    description: 'Large centered text',
  },
  {
    id: 'section-title-description',
    name: 'Section title and description',
    description: 'Title/subtitle with description',
  },
  {
    id: 'caption',
    name: 'Caption',
    description: 'Bottom caption text',
  },
  {
    id: 'big-number',
    name: 'Big number',
    description: 'Large number with text',
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty slide',
  },
]

