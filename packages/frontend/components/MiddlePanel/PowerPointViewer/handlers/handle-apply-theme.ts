import { Slide, SlideElement, FillStyle } from '../PowerPointViewer'
import { ThemeType, getThemeBackgroundColor, getThemeTextColor, getThemeAccentColor, getThemeSecondaryColor, Theme } from '../types/slide-layouts'
import { getThemeService } from '../services/theme-service'
import { normalizeFill } from '../utils/fill-utils'
import { curatedThemes } from '../themes/curated-themes'

export interface ThemeApplicationResult {
  background: string | FillStyle
  backgroundStyle?: FillStyle
  decorativeElements?: Array<{
    id: string
    shape: 'circle' | 'rect' | 'line' | 'triangle' | 'blob'
    x: number
    y: number
    width?: number
    height?: number
    color: string
    opacity: number
    rotation?: number
    scale?: number
  }>
  elements: SlideElement[]
  typography?: {
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
}

export async function applyThemeToSlide(
  slide: Slide,
  themeType: ThemeType
): Promise<ThemeApplicationResult> {
  const themeService = getThemeService()
  const theme = await themeService.getThemeById(themeType)
  
  if (!theme) {
    // Fallback to default theme
    return {
      background: '#ffffff',
      elements: slide.elements,
    }
  }

  // Determine background style
  let background: string | FillStyle = getThemeBackgroundColor(theme)
  let backgroundStyle: FillStyle | undefined

  if (theme.backgroundStyle) {
    backgroundStyle = theme.backgroundStyle as FillStyle
    background = backgroundStyle
  } else if (theme.background) {
    background = theme.background
  }

  // Get color palette (backward compatible)
  const textColor = getThemeTextColor(theme)
  const accentColor = getThemeAccentColor(theme)
  const secondaryColor = getThemeSecondaryColor(theme)

  // Update elements with theme colors and typography
  const elements = slide.elements.map(element => {
    const updated = { ...element }

    if (element.type === 'text') {
      // Update text color based on theme
      const colorToUse = textColor.replace('#', '')
      updated.color = colorToUse

      // Apply typography settings if available
      if (theme.typography) {
        // Determine if this is a title or body text based on size or content
        const isTitle = (element.fontSize && element.fontSize > 24) || 
                       (element.content && element.content.length < 50)
        
        if (isTitle && theme.typography.titleFont) {
          updated.fontFace = theme.typography.titleFont
        } else if (theme.typography.bodyFont) {
          updated.fontFace = theme.typography.bodyFont
        }

        if (isTitle && theme.typography.titleSize) {
          updated.fontSize = theme.typography.titleSize
        } else if (theme.typography.bodySize) {
          updated.fontSize = theme.typography.bodySize
        }

        if (isTitle && theme.typography.titleWeight) {
          updated.bold = typeof theme.typography.titleWeight === 'number' 
            ? theme.typography.titleWeight >= 600 
            : String(theme.typography.titleWeight).includes('bold') || String(theme.typography.titleWeight).includes('700')
        }
      }
    } else if (element.type === 'shape') {
      // Update shape fill with theme accent, or keep existing if custom
      const currentFill = normalizeFill(element.fill)
      const defaultFill = '#4a90d9'
      
      // Only update if using default fill or no fill
      if (!currentFill || 
          (currentFill.kind === 'solid' && 
           (currentFill.color === defaultFill || currentFill.color === defaultFill.replace('#', '')))) {
        updated.fill = { kind: 'solid', color: accentColor }
      }
    }

    return updated
  })

  // Prepare decorative elements
  const decorativeElements = theme.decorativeElements?.map(el => ({
    id: el.id,
    shape: el.shape,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    color: el.color,
    opacity: el.opacity,
    rotation: el.rotation,
    scale: el.scale,
  }))

  return {
    background,
    backgroundStyle,
    decorativeElements,
    elements,
    typography: theme.typography,
  }
}

// Synchronous version for backward compatibility (uses cached themes)
export function applyThemeToSlideSync(
  slide: Slide,
  themeType: ThemeType
): ThemeApplicationResult {
  // Combine old themes and curated themes for sync access
  const { themes: oldThemes } = require('../types/slide-layouts')
  const allThemes: Theme[] = [...oldThemes, ...curatedThemes]
  
  // Find the theme by ID
  const theme = allThemes.find((t: Theme) => t.id === themeType) || allThemes[0]

  if (!theme) {
    // Fallback to default theme
    return {
      background: '#ffffff',
      elements: slide.elements,
    }
  }

  // Determine background style
  let background: string | FillStyle = getThemeBackgroundColor(theme)
  let backgroundStyle: FillStyle | undefined

  if (theme.backgroundStyle) {
    backgroundStyle = theme.backgroundStyle as FillStyle
    background = backgroundStyle
  } else if (theme.background) {
    background = theme.background
  }

  // Get color palette (backward compatible)
  const textColor = getThemeTextColor(theme)
  const accentColor = getThemeAccentColor(theme)
  const secondaryColor = getThemeSecondaryColor(theme)

  // Update elements with theme colors and typography
  const elements = slide.elements.map(element => {
    const updated = { ...element }

    if (element.type === 'text') {
      // Update text color based on theme
      const colorToUse = textColor.replace('#', '')
      updated.color = colorToUse

      // Apply typography settings if available
      if (theme.typography) {
        // Determine if this is a title or body text based on size or content
        const isTitle = (element.fontSize && element.fontSize > 24) || 
                       (element.content && element.content.length < 50)
        
        if (isTitle && theme.typography.titleFont) {
          updated.fontFace = theme.typography.titleFont
        } else if (theme.typography.bodyFont) {
          updated.fontFace = theme.typography.bodyFont
        }

        if (isTitle && theme.typography.titleSize) {
          updated.fontSize = theme.typography.titleSize
        } else if (theme.typography.bodySize) {
          updated.fontSize = theme.typography.bodySize
        }

        if (isTitle && theme.typography.titleWeight) {
          updated.bold = typeof theme.typography.titleWeight === 'number' 
            ? theme.typography.titleWeight >= 600 
            : String(theme.typography.titleWeight).includes('bold') || String(theme.typography.titleWeight).includes('700')
        }
      }
    } else if (element.type === 'shape') {
      // Update shape fill with theme accent, or keep existing if custom
      const currentFill = normalizeFill(element.fill)
      const defaultFill = '#4a90d9'
      
      // Only update if using default fill or no fill
      if (!currentFill || 
          (currentFill.kind === 'solid' && 
           (currentFill.color === defaultFill || currentFill.color === defaultFill.replace('#', '')))) {
        updated.fill = { kind: 'solid', color: accentColor }
      }
    }

    return updated
  })

  // Prepare decorative elements
  const decorativeElements = theme.decorativeElements?.map(el => ({
    id: el.id,
    shape: el.shape,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    color: el.color,
    opacity: el.opacity,
    rotation: el.rotation,
    scale: el.scale,
  }))

  return {
    background,
    backgroundStyle,
    decorativeElements,
    elements,
    typography: theme.typography,
  }
}

