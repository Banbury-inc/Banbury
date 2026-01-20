import { Slide, SlideElement } from '../../../PowerPointViewer'
import { ThemeType } from '../../../types/slide-layouts'
import { applyThemeToSlide } from './handle-apply-theme'
import { Template } from '../../../templates/loader'

interface TemplateApplicationResult {
  success: boolean
  slides: Slide[]
  error?: string
}

/**
 * Apply a template to the entire presentation
 * @param slides - Current slides in the presentation
 * @param templateId - ID of the template to apply
 * @returns Result object with success status and updated slides
 */
export async function applyTemplateToPresentation(
  slides: Slide[],
  templateId: string
): Promise<TemplateApplicationResult> {
  try {
    // Map template IDs to theme types
    const templateThemeMap: Record<string, ThemeType> = {
      'professional': 'blue',
      'modern': 'default',
      'minimal': 'minimal',
      'dark': 'dark',
      'colorful': 'orange',
      'two-column': 'default',
    }

    const themeType = templateThemeMap[templateId]

    if (!themeType) {
      return {
        success: false,
        slides,
        error: `Unknown template ID: ${templateId}`,
      }
    }

    // Apply the theme to all slides
    const updatedSlides = slides.map(slide => {
      const { background, elements } = applyThemeToSlide(slide, themeType)
      return {
        ...slide,
        theme: themeType,
        background,
        elements,
      }
    })

    return {
      success: true,
      slides: updatedSlides,
    }
  } catch (error) {
    console.error('Error applying template:', error)
    return {
      success: false,
      slides,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Apply a template to a single slide
 * Maps slide content to template placeholders based on placeholder roles
 * @param slide - The slide to apply the template to
 * @param template - The template to apply
 * @returns Updated slide with template applied
 */
export function applyTemplateToSlide(slide: Slide, template: Template): Slide {
  // Apply template background
  const updatedSlide: Slide = {
    ...slide,
    background: template.background,
  }

  // Map existing elements to template placeholders
  const mappedElements: SlideElement[] = []
  const existingElements = [...slide.elements]

  // Try to match existing elements to placeholders by role or type
  for (const placeholder of template.placeholders) {
    // Find a matching element
    let matchedElement: SlideElement | undefined

    // First, try to match by placeholder role if it exists
    if (placeholder.role) {
      matchedElement = existingElements.find(
        el => el.placeholder === placeholder.role
      )
    }

    // If no match by role, try to match by type
    if (!matchedElement) {
      if (placeholder.role === 'title') {
        // Find first text element with large font or bold
        matchedElement = existingElements.find(
          el => el.type === 'text' && (el.fontSize && el.fontSize > 30 || el.bold)
        )
      } else if (placeholder.role === 'subtitle') {
        // Find text element with medium font
        matchedElement = existingElements.find(
          el => el.type === 'text' && el.fontSize && el.fontSize > 16 && el.fontSize <= 30
        )
      } else if (placeholder.role === 'body' || placeholder.role === 'leftColumn' || placeholder.role === 'rightColumn') {
        // Find any remaining text element
        matchedElement = existingElements.find(el => el.type === 'text')
      }
    }

    // Create new element based on placeholder
    if (matchedElement) {
      // Remove matched element from remaining elements
      const index = existingElements.indexOf(matchedElement)
      if (index > -1) {
        existingElements.splice(index, 1)
      }

      // Apply placeholder styling to matched element
      const newElement: SlideElement = {
        ...matchedElement,
        x: placeholder.x,
        y: placeholder.y,
        width: placeholder.width,
        height: placeholder.height,
        fontSize: placeholder.fontSize ?? matchedElement.fontSize,
        fontFace: placeholder.fontFace ?? matchedElement.fontFace,
        color: placeholder.color ?? matchedElement.color,
        bold: placeholder.bold ?? matchedElement.bold,
        align: placeholder.align ?? matchedElement.align,
        valign: placeholder.valign ?? matchedElement.valign,
        placeholder: placeholder.role,
      }
      mappedElements.push(newElement)
    } else {
      // Create empty placeholder element
      const newElement: SlideElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: 'text',
        x: placeholder.x,
        y: placeholder.y,
        width: placeholder.width,
        height: placeholder.height,
        content: getPlaceholderText(placeholder.role),
        fontSize: placeholder.fontSize ?? 18,
        fontFace: placeholder.fontFace ?? 'Arial',
        color: placeholder.color ?? '#000000',
        bold: placeholder.bold ?? false,
        align: placeholder.align ?? 'left',
        valign: placeholder.valign ?? 'top',
        placeholder: placeholder.role,
      }
      mappedElements.push(newElement)
    }
  }

  // Add any remaining elements that weren't mapped
  mappedElements.push(...existingElements)

  updatedSlide.elements = mappedElements
  return updatedSlide
}

/**
 * Get placeholder text based on placeholder role
 */
function getPlaceholderText(role: string): string {
  switch (role) {
    case 'title':
      return 'Click to add title'
    case 'subtitle':
      return 'Click to add subtitle'
    case 'body':
      return 'Click to add text'
    case 'leftColumn':
      return 'Left column text'
    case 'rightColumn':
      return 'Right column text'
    case 'caption':
      return 'Caption'
    case 'number':
      return '1'
    default:
      return 'Click to add text'
  }
}
