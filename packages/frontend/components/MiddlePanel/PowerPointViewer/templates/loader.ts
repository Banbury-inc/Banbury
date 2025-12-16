import { SlideElement } from '../PowerPointViewer'

export interface Template {
  id: string
  name: string
  description: string
  thumbnail?: string
  background?: string
  placeholders: TemplatePlaceholder[]
}

export interface TemplatePlaceholder {
  role: 'title' | 'subtitle' | 'body' | 'leftColumn' | 'rightColumn' | 'caption' | 'number'
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontFace?: string
  color?: string
  bold?: boolean
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
}

// Template definitions
const templates: Template[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean and professional template with structured layout',
    background: '#FFFFFF',
    placeholders: [
      {
        role: 'title',
        x: 10,
        y: 15,
        width: 80,
        height: 15,
        fontSize: 44,
        fontFace: 'Calibri',
        color: '#1F4788',
        bold: true,
        align: 'left',
        valign: 'middle',
      },
      {
        role: 'subtitle',
        x: 10,
        y: 32,
        width: 80,
        height: 8,
        fontSize: 20,
        fontFace: 'Calibri',
        color: '#5B9BD5',
        bold: false,
        align: 'left',
        valign: 'middle',
      },
      {
        role: 'body',
        x: 10,
        y: 45,
        width: 80,
        height: 40,
        fontSize: 18,
        fontFace: 'Calibri',
        color: '#333333',
        bold: false,
        align: 'left',
        valign: 'top',
      },
    ],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold colors',
    background: '#F5F5F5',
    placeholders: [
      {
        role: 'title',
        x: 10,
        y: 20,
        width: 80,
        height: 20,
        fontSize: 54,
        fontFace: 'Arial',
        color: '#2E75B6',
        bold: true,
        align: 'center',
        valign: 'middle',
      },
      {
        role: 'body',
        x: 10,
        y: 45,
        width: 80,
        height: 40,
        fontSize: 20,
        fontFace: 'Arial',
        color: '#404040',
        bold: false,
        align: 'left',
        valign: 'top',
      },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Minimalist design with lots of whitespace',
    background: '#FFFFFF',
    placeholders: [
      {
        role: 'title',
        x: 15,
        y: 35,
        width: 70,
        height: 15,
        fontSize: 48,
        fontFace: 'Helvetica',
        color: '#000000',
        bold: true,
        align: 'center',
        valign: 'middle',
      },
      {
        role: 'body',
        x: 20,
        y: 55,
        width: 60,
        height: 25,
        fontSize: 16,
        fontFace: 'Helvetica',
        color: '#666666',
        bold: false,
        align: 'center',
        valign: 'top',
      },
    ],
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme with light text',
    background: '#1E1E1E',
    placeholders: [
      {
        role: 'title',
        x: 10,
        y: 20,
        width: 80,
        height: 15,
        fontSize: 44,
        fontFace: 'Arial',
        color: '#FFFFFF',
        bold: true,
        align: 'left',
        valign: 'middle',
      },
      {
        role: 'body',
        x: 10,
        y: 40,
        width: 80,
        height: 45,
        fontSize: 18,
        fontFace: 'Arial',
        color: '#E0E0E0',
        bold: false,
        align: 'left',
        valign: 'top',
      },
    ],
  },
  {
    id: 'colorful',
    name: 'Colorful',
    description: 'Vibrant and energetic design',
    background: '#FFEAA7',
    placeholders: [
      {
        role: 'title',
        x: 10,
        y: 15,
        width: 80,
        height: 18,
        fontSize: 48,
        fontFace: 'Arial',
        color: '#D63031',
        bold: true,
        align: 'center',
        valign: 'middle',
      },
      {
        role: 'body',
        x: 10,
        y: 38,
        width: 80,
        height: 47,
        fontSize: 20,
        fontFace: 'Arial',
        color: '#2D3436',
        bold: false,
        align: 'left',
        valign: 'top',
      },
    ],
  },
  {
    id: 'two-column',
    name: 'Two Column',
    description: 'Layout with two equal columns',
    background: '#FFFFFF',
    placeholders: [
      {
        role: 'title',
        x: 10,
        y: 10,
        width: 80,
        height: 12,
        fontSize: 36,
        fontFace: 'Calibri',
        color: '#2E75B6',
        bold: true,
        align: 'center',
        valign: 'middle',
      },
      {
        role: 'leftColumn',
        x: 5,
        y: 25,
        width: 42,
        height: 60,
        fontSize: 18,
        fontFace: 'Calibri',
        color: '#333333',
        bold: false,
        align: 'left',
        valign: 'top',
      },
      {
        role: 'rightColumn',
        x: 53,
        y: 25,
        width: 42,
        height: 60,
        fontSize: 18,
        fontFace: 'Calibri',
        color: '#333333',
        bold: false,
        align: 'left',
        valign: 'top',
      },
    ],
  },
]

// Template cache
let loadedTemplates: Template[] | null = null

/**
 * Load all available templates
 */
export function loadTemplates(): Template[] {
  if (!loadedTemplates) {
    loadedTemplates = templates
  }
  return loadedTemplates
}

/**
 * Get a template by its ID
 */
export function getTemplateById(templateId: string): Template | undefined {
  const allTemplates = loadTemplates()
  return allTemplates.find(t => t.id === templateId)
}

/**
 * Get all available template IDs
 */
export function getTemplateIds(): string[] {
  return loadTemplates().map(t => t.id)
}

/**
 * Get template metadata (without full placeholder data)
 */
export function getTemplateMetadata(): Array<{ id: string; name: string; description: string; thumbnail?: string }> {
  return loadTemplates().map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    thumbnail: t.thumbnail,
  }))
}

