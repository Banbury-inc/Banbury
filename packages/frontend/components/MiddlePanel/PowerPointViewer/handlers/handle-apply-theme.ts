import { Slide, SlideElement } from '../PowerPointViewer'
import { ThemeType, themes } from '../types/slide-layouts'

export function applyThemeToSlide(
  slide: Slide,
  themeType: ThemeType
): { background: string; elements: SlideElement[] } {
  const theme = themes.find(t => t.id === themeType) || themes[0]

  // Update background
  const background = theme.background

  // Update elements with theme colors
  const elements = slide.elements.map(element => {
    const updated = { ...element }

    if (element.type === 'text') {
      // Update text color based on theme
      updated.color = theme.text.replace('#', '')
    } else if (element.type === 'shape') {
      // Update shape fill with theme accent, or keep existing if custom
      const currentFill = element.fill || ''
      const defaultFill = '#4a90d9'
      if (!currentFill || currentFill === defaultFill || currentFill === defaultFill.replace('#', '')) {
        updated.fill = theme.accent
      }
    }

    return updated
  })

  return { background, elements }
}

