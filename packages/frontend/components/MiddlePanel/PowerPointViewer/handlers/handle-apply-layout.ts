import { SlideElement, Slide } from '../PowerPointViewer'
import { SlideLayoutType } from '../types/slide-layouts'

export function applyLayoutToSlide(
  slide: Slide,
  layoutType: SlideLayoutType
): SlideElement[] {
  const elements: SlideElement[] = []

  switch (layoutType) {
    case 'title': {
      // Title slide: Large title at top, subtitle below
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 30,
        width: 80,
        height: 15,
        content: 'Click to add title',
        fontSize: 44,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'center',
        valign: 'middle',
      })
      elements.push({
        id: `text-${Date.now()}-2`,
        type: 'text',
        x: 10,
        y: 50,
        width: 80,
        height: 10,
        content: 'Click to add subtitle',
        fontSize: 24,
        fontFace: 'Arial',
        color: '666666',
        align: 'center',
        valign: 'middle',
      })
      break
    }

    case 'section-header': {
      // Section header: Single centered title
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 40,
        width: 80,
        height: 20,
        content: 'Click to add title',
        fontSize: 36,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'center',
        valign: 'middle',
      })
      break
    }

    case 'title-body': {
      // Title and body: Title at top, large body text below
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 10,
        width: 80,
        height: 10,
        content: 'Click to add title',
        fontSize: 32,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'left',
        valign: 'top',
      })
      elements.push({
        id: `text-${Date.now()}-2`,
        type: 'text',
        x: 10,
        y: 25,
        width: 80,
        height: 60,
        content: 'Click to add text',
        fontSize: 18,
        fontFace: 'Arial',
        color: '363636',
        align: 'left',
        valign: 'top',
      })
      break
    }

    case 'title-two-column': {
      // Title and two columns: Title at top, two equal columns below
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 10,
        width: 80,
        height: 10,
        content: 'Click to add title',
        fontSize: 32,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'left',
        valign: 'top',
      })
      elements.push({
        id: `text-${Date.now()}-2`,
        type: 'text',
        x: 10,
        y: 25,
        width: 38,
        height: 60,
        content: 'Click to add text',
        fontSize: 18,
        fontFace: 'Arial',
        color: '363636',
        align: 'left',
        valign: 'top',
      })
      elements.push({
        id: `text-${Date.now()}-3`,
        type: 'text',
        x: 52,
        y: 25,
        width: 38,
        height: 60,
        content: 'Click to add text',
        fontSize: 18,
        fontFace: 'Arial',
        color: '363636',
        align: 'left',
        valign: 'top',
      })
      break
    }

    case 'title-only': {
      // Title only: Single centered title
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 40,
        width: 80,
        height: 20,
        content: 'Click to add title',
        fontSize: 44,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'center',
        valign: 'middle',
      })
      break
    }

    case 'one-column-text': {
      // One column text: Small title top-left, large text box below
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 10,
        width: 40,
        height: 8,
        content: 'Click to add title',
        fontSize: 24,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'left',
        valign: 'top',
      })
      elements.push({
        id: `text-${Date.now()}-2`,
        type: 'text',
        x: 10,
        y: 22,
        width: 80,
        height: 70,
        content: 'Click to add text',
        fontSize: 18,
        fontFace: 'Arial',
        color: '363636',
        align: 'left',
        valign: 'top',
      })
      break
    }

    case 'main-point': {
      // Main point: Single large centered text box
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 35,
        width: 80,
        height: 30,
        content: 'Click to add title',
        fontSize: 48,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'center',
        valign: 'middle',
      })
      break
    }

    case 'section-title-description': {
      // Section title and description: Title/subtitle left, description box right
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 10,
        width: 45,
        height: 10,
        content: 'Click to add title',
        fontSize: 28,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'left',
        valign: 'top',
      })
      elements.push({
        id: `text-${Date.now()}-2`,
        type: 'text',
        x: 10,
        y: 22,
        width: 45,
        height: 8,
        content: 'Click to add subtitle',
        fontSize: 20,
        fontFace: 'Arial',
        color: '666666',
        align: 'left',
        valign: 'top',
      })
      elements.push({
        id: `text-${Date.now()}-3`,
        type: 'text',
        x: 58,
        y: 10,
        width: 32,
        height: 75,
        content: 'Click to add text',
        fontSize: 16,
        fontFace: 'Arial',
        color: '363636',
        align: 'left',
        valign: 'top',
      })
      break
    }

    case 'caption': {
      // Caption: Single text box at bottom center
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 80,
        width: 80,
        height: 15,
        content: 'Click to add text',
        fontSize: 18,
        fontFace: 'Arial',
        color: '363636',
        align: 'center',
        valign: 'middle',
      })
      break
    }

    case 'big-number': {
      // Big number: Large number display with text below
      elements.push({
        id: `text-${Date.now()}-1`,
        type: 'text',
        x: 10,
        y: 30,
        width: 80,
        height: 25,
        content: 'xx%',
        fontSize: 72,
        fontFace: 'Arial',
        color: '363636',
        bold: true,
        align: 'center',
        valign: 'middle',
      })
      elements.push({
        id: `text-${Date.now()}-2`,
        type: 'text',
        x: 10,
        y: 60,
        width: 80,
        height: 15,
        content: 'Click to add text',
        fontSize: 20,
        fontFace: 'Arial',
        color: '666666',
        align: 'center',
        valign: 'middle',
      })
      break
    }

    case 'blank': {
      // Blank: No elements
      break
    }

    case 'content':
    case 'twoColumn': {
      // Legacy layouts - treat as title-body or title-two-column
      if (layoutType === 'twoColumn') {
        return applyLayoutToSlide(slide, 'title-two-column')
      }
      return applyLayoutToSlide(slide, 'title-body')
    }

    default:
      // Default to blank if unknown layout
      break
  }

  return elements
}

