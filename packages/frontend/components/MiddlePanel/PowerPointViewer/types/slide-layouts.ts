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

export interface Theme {
  id: ThemeType
  name: string
  background: string
  text: string
  accent: string
  secondary: string
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    background: '#ffffff',
    text: '#363636',
    accent: '#4a90d9',
    secondary: '#e0e0e0',
  },
  {
    id: 'dark',
    name: 'Dark',
    background: '#1a1a1a',
    text: '#ffffff',
    accent: '#4a90d9',
    secondary: '#333333',
  },
  {
    id: 'blue',
    name: 'Blue',
    background: '#f0f7ff',
    text: '#1a3a5f',
    accent: '#1e88e5',
    secondary: '#90caf9',
  },
  {
    id: 'green',
    name: 'Green',
    background: '#f1f8e9',
    text: '#2e7d32',
    accent: '#43a047',
    secondary: '#a5d6a7',
  },
  {
    id: 'purple',
    name: 'Purple',
    background: '#f3e5f5',
    text: '#6a1b9a',
    accent: '#8e24aa',
    secondary: '#ce93d8',
  },
  {
    id: 'orange',
    name: 'Orange',
    background: '#fff3e0',
    text: '#e65100',
    accent: '#fb8c00',
    secondary: '#ffb74d',
  },
  {
    id: 'red',
    name: 'Red',
    background: '#ffebee',
    text: '#c62828',
    accent: '#e53935',
    secondary: '#ef9a9a',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    background: '#ffffff',
    text: '#000000',
    accent: '#000000',
    secondary: '#f5f5f5',
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

