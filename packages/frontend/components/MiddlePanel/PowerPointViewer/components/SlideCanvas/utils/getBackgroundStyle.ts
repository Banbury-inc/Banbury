import { Slide } from '../../../PowerPointViewer'
import { fillStyleToCSS, normalizeFill } from '../../../utils/fill-utils'

export function getBackgroundStyle(slide: Slide): React.CSSProperties {
  // Check if slide has background image
  if (slide.backgroundImage) {
    return {
      backgroundImage: `url(${slide.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }

  // Check if slide has backgroundStyle (FillStyle - gradient or solid)
  if (slide.backgroundStyle) {
    const fill = normalizeFill(slide.backgroundStyle)
    if (fill) {
      return {
        background: fillStyleToCSS(fill),
      }
    }
  }

  // Fallback to solid color background
  return {
    backgroundColor: slide.background || '#ffffff',
  }
}
