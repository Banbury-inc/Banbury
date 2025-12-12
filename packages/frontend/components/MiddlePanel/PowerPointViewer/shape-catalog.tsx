import { ReactElement } from 'react'

export type ShapeType =
  | 'rect'
  | 'round-rect'
  | 'snip-top-right'
  | 'snip-top-left'
  | 'snip-top-both'
  | 'parallelogram-right'
  | 'parallelogram-left'
  | 'trapezoid'
  | 'chevron'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'decagon'
  | 'dodecagon'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'right-triangle'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'double-arrow'
  | 'bent-arrow'
  | 'curved-arrow'
  | 'line'
  | 'line-diagonal'
  | 'cross'
  | 'plus'
  | 'star-4'
  | 'star-5'
  | 'star-6'
  | 'star-7'
  | 'star-8'
  | 'star-10'
  | 'star-12'
  | 'heart'
  | 'smiley'
  | 'lightning'
  | 'sun'
  | 'moon'
  | 'cloud'
  | 'donut'
  | 'pie-quarter'
  | 'pie-half'
  | 'pie-three-quarter'
  | 'cylinder'
  | 'cube'
  | 'frame'
  | 'folded-corner'
  | 'plaque'
  | 'bracket-left'
  | 'bracket-right'
  | 'callout'
  | 'no-symbol'
  | 'check'
  | 'x-mark'

export interface ShapeRenderProps {
  fill: string
  stroke?: string
  strokeWidth?: number
  text?: string
}

export interface ShapeDefinition {
  id: ShapeType
  label: string
  defaultText?: string
  supportsLabel?: boolean
}

const viewBox = '0 0 100 100'

function regularPolygonPoints(sides: number, radius = 44, cx = 50, cy = 50): string {
  if (sides < 3) return ''
  const angle = (2 * Math.PI) / sides
  const points: string[] = []
  for (let i = 0; i < sides; i += 1) {
    const x = cx + radius * Math.sin(angle * i)
    const y = cy - radius * Math.cos(angle * i)
    points.push(`${x.toFixed(3)},${y.toFixed(3)}`)
  }
  return points.join(' ')
}

function starPoints(points: number, outer = 44, inner = 18, cx = 50, cy = 50): string {
  const step = Math.PI / points
  const coords: string[] = []
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const a = step * i
    const x = cx + r * Math.sin(a)
    const y = cy - r * Math.cos(a)
    coords.push(`${x.toFixed(3)},${y.toFixed(3)}`)
  }
  return coords.join(' ')
}

function renderCenteredText(text: string | undefined, fill: string, stroke?: string, size = 26): ReactElement | null {
  if (!text?.trim()) return null
  return (
    <text
      x="50"
      y="55"
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="Arial, sans-serif"
      fontSize={size}
      fill={stroke || '#1f2937'}
    >
      {text}
    </text>
  )
}

const shapeRenderers: Record<ShapeType, (props: ShapeRenderProps) => ReactElement> = {
  rect: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <rect x="6" y="6" width="88" height="88" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'round-rect': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <rect x="8" y="8" width="84" height="84" rx="14" ry="14" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'snip-top-right': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M6 6 H74 L94 26 V94 H6 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'snip-top-left': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M26 6 H94 V94 H6 V26 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'snip-top-both': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M26 6 H74 L94 26 V94 H6 V26 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'parallelogram-right': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points="18,6 94,6 82,94 6,94" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'parallelogram-left': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points="6,6 82,6 94,94 18,94" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  trapezoid: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points="18,12 82,12 94,88 6,88" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  chevron: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M10 15 L50 85 L90 15 L70 15 L50 55 L30 15 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  diamond: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points="50,6 94,50 50,94 6,50" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  pentagon: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={regularPolygonPoints(5)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  hexagon: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={regularPolygonPoints(6)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  octagon: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={regularPolygonPoints(8)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  decagon: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={regularPolygonPoints(10)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  dodecagon: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={regularPolygonPoints(12)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  circle: ({ fill, stroke, strokeWidth, text }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <circle cx="50" cy="50" r="44" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {renderCenteredText(text, fill, stroke, 26)}
    </svg>
  ),
  ellipse: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <ellipse cx="50" cy="50" rx="44" ry="32" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  triangle: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points="50,6 94,94 6,94" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'right-triangle': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points="6,6 94,6 6,94" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'arrow-right': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M10 40 H60 V22 L90 50 L60 78 V60 H10 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'arrow-left': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M90 40 H40 V22 L10 50 L40 78 V60 H90 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'arrow-up': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M60 90 V40 H78 L50 10 L22 40 H40 V90 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'arrow-down': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M60 10 V60 H78 L50 90 L22 60 H40 V10 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'double-arrow': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M22 40 L50 10 L78 40 H60 V60 H78 L50 90 L22 60 H40 V40 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'bent-arrow': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M18 22 H58 V10 L90 42 L58 74 V60 H34 V90 H18 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'curved-arrow': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path
        d="M70 16 C42 14 22 32 22 54 C22 68 32 80 46 84 L34 70 H58 L72 92 L58 108"
        fill="none"
        stroke={stroke || fill}
        strokeWidth={strokeWidth || 4}
        strokeLinecap="round"
      />
      <path d="M62 18 L78 10 L82 28 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  line: ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <line x1="10" y1="50" x2="90" y2="50" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 4} />
    </svg>
  ),
  'line-diagonal': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <line x1="18" y1="82" x2="82" y2="18" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 4} />
    </svg>
  ),
  cross: ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <g stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 8}>
        <line x1="18" y1="50" x2="82" y2="50" />
        <line x1="50" y1="18" x2="50" y2="82" />
      </g>
    </svg>
  ),
  plus: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M42 18 H58 V42 H82 V58 H58 V82 H42 V58 H18 V42 H42 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'star-4': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points="50,6 62,38 94,50 62,62 50,94 38,62 6,50 38,38" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'star-5': ({ fill, stroke, strokeWidth, text }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={starPoints(5)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {renderCenteredText(text, fill, stroke)}
    </svg>
  ),
  'star-6': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={starPoints(6)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'star-7': ({ fill, stroke, strokeWidth, text }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={starPoints(7)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {renderCenteredText(text, fill, stroke)}
    </svg>
  ),
  'star-8': ({ fill, stroke, strokeWidth, text }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={starPoints(8)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {renderCenteredText(text, fill, stroke)}
    </svg>
  ),
  'star-10': ({ fill, stroke, strokeWidth, text }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={starPoints(10)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {renderCenteredText(text, fill, stroke)}
    </svg>
  ),
  'star-12': ({ fill, stroke, strokeWidth, text }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points={starPoints(12)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {renderCenteredText(text, fill, stroke)}
    </svg>
  ),
  heart: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M50 90 L18 58 C6 44 10 22 28 16 C38 12 48 16 50 24 C52 16 62 12 72 16 C90 22 94 44 82 58 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  smiley: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <circle cx="50" cy="50" r="44" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <circle cx="36" cy="44" r="4" fill={stroke || '#1f2937'} />
      <circle cx="64" cy="44" r="4" fill={stroke || '#1f2937'} />
      <path d="M32 60 Q50 74 68 60" fill="none" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth ? Math.max(2, strokeWidth) : 3} strokeLinecap="round" />
    </svg>
  ),
  lightning: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M56 6 L18 58 H44 L34 94 L82 42 H58 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  sun: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <circle cx="50" cy="50" r="20" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <g stroke={stroke || fill} strokeWidth={strokeWidth || 3} strokeLinecap="round">
        <line x1="50" y1="6" x2="50" y2="18" />
        <line x1="50" y1="82" x2="50" y2="94" />
        <line x1="6" y1="50" x2="18" y2="50" />
        <line x1="82" y1="50" x2="94" y2="50" />
        <line x1="20" y1="20" x2="30" y2="30" />
        <line x1="70" y1="70" x2="80" y2="80" />
        <line x1="80" y1="20" x2="70" y2="30" />
        <line x1="30" y1="70" x2="20" y2="80" />
      </g>
    </svg>
  ),
  moon: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M64 10 C44 12 30 28 30 50 C30 72 44 88 64 90 C50 84 42 70 42 50 C42 30 50 16 64 10 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  cloud: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M30 70 H78 C88 70 94 64 94 54 C94 44 86 38 78 38 C75 26 64 18 52 22 C44 12 26 16 22 30 C12 32 6 40 6 50 C6 62 16 70 30 70 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  donut: ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <circle cx="50" cy="50" r="40" fill="none" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 8} />
      <circle cx="50" cy="50" r="18" fill="none" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 8} />
    </svg>
  ),
  'pie-quarter': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M50 6 A44 44 0 0 1 94 50 H50 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <circle cx="50" cy="50" r="44" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'pie-half': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M50 6 A44 44 0 0 1 94 50 A44 44 0 0 1 50 94 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <circle cx="50" cy="50" r="44" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'pie-three-quarter': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M50 6 A44 44 0 0 1 94 50 A44 44 0 0 1 74 86 A44 44 0 0 1 6 50 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <circle cx="50" cy="50" r="44" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  cylinder: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <ellipse cx="50" cy="18" rx="34" ry="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <rect x="16" y="18" width="68" height="64" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <ellipse cx="50" cy="82" rx="34" ry="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  cube: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <polygon points="26,20 62,8 94,26 58,38" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <polygon points="26,20 58,38 58,78 26,94" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <polygon points="58,38 94,26 94,66 58,78" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  frame: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" fillRule="evenodd">
      <path d="M8 8 H92 V92 H8 Z M26 26 V74 H74 V26 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'folded-corner': ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M10 10 H68 L90 32 V90 H10 Z M68 10 V32 H90" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  plaque: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M26 10 H74 C86 10 90 22 90 34 V66 C90 78 86 90 74 90 H26 C14 90 10 78 10 66 V34 C10 22 14 10 26 10 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'bracket-left': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M62 12 H34 V88 H62" fill="none" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 6} />
    </svg>
  ),
  'bracket-right': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M38 12 H66 V88 H38" fill="none" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 6} />
    </svg>
  ),
  callout: ({ fill, stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M16 22 H84 V62 H60 L46 82 L44 62 H16 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  ),
  'no-symbol': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <circle cx="50" cy="50" r="40" fill="none" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 8} />
      <line x1="26" y1="26" x2="74" y2="74" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 8} />
    </svg>
  ),
  check: ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <path d="M18 50 L40 72 L82 28" fill="none" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'x-mark': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full">
      <line x1="26" y1="26" x2="74" y2="74" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 8} strokeLinecap="round" />
      <line x1="74" y1="26" x2="26" y2="74" stroke={stroke || '#1f2937'} strokeWidth={strokeWidth || 8} strokeLinecap="round" />
    </svg>
  ),
}

export const shapeCatalog: ShapeDefinition[] = [
  { id: 'rect', label: 'Rectangle', supportsLabel: true },
  { id: 'round-rect', label: 'Rounded Rectangle', supportsLabel: true },
  { id: 'snip-top-right', label: 'Cut Top Right', supportsLabel: true },
  { id: 'snip-top-left', label: 'Cut Top Left', supportsLabel: true },
  { id: 'snip-top-both', label: 'Cut Top Both', supportsLabel: true },
  { id: 'parallelogram-right', label: 'Parallelogram R', supportsLabel: true },
  { id: 'parallelogram-left', label: 'Parallelogram L', supportsLabel: true },
  { id: 'trapezoid', label: 'Trapezoid', supportsLabel: true },
  { id: 'chevron', label: 'Chevron', supportsLabel: true },
  { id: 'diamond', label: 'Diamond', supportsLabel: true },
  { id: 'pentagon', label: 'Pentagon', supportsLabel: true },
  { id: 'hexagon', label: 'Hexagon', supportsLabel: true },
  { id: 'octagon', label: 'Octagon', supportsLabel: true },
  { id: 'decagon', label: 'Decagon', supportsLabel: true },
  { id: 'dodecagon', label: 'Dodecagon', supportsLabel: true },
  { id: 'circle', label: 'Circle', supportsLabel: true },
  { id: 'ellipse', label: 'Ellipse', supportsLabel: true },
  { id: 'triangle', label: 'Triangle', supportsLabel: true },
  { id: 'right-triangle', label: 'Right Triangle', supportsLabel: true },
  { id: 'arrow-right', label: 'Arrow Right', supportsLabel: true },
  { id: 'arrow-left', label: 'Arrow Left', supportsLabel: true },
  { id: 'arrow-up', label: 'Arrow Up', supportsLabel: true },
  { id: 'arrow-down', label: 'Arrow Down', supportsLabel: true },
  { id: 'double-arrow', label: 'Double Arrow', supportsLabel: true },
  { id: 'bent-arrow', label: 'Bent Arrow', supportsLabel: true },
  { id: 'curved-arrow', label: 'Curved Arrow' },
  { id: 'line', label: 'Line' },
  { id: 'line-diagonal', label: 'Diagonal Line' },
  { id: 'cross', label: 'Cross' },
  { id: 'plus', label: 'Plus' },
  { id: 'star-4', label: '4-Point Star' },
  { id: 'star-5', label: '5-Point Star', defaultText: '5', supportsLabel: true },
  { id: 'star-6', label: '6-Point Star' },
  { id: 'star-7', label: '7-Point Star', defaultText: '7', supportsLabel: true },
  { id: 'star-8', label: '8-Point Star', defaultText: '8', supportsLabel: true },
  { id: 'star-10', label: '10-Point Star', defaultText: '10', supportsLabel: true },
  { id: 'star-12', label: '12-Point Star', defaultText: '12', supportsLabel: true },
  { id: 'heart', label: 'Heart' },
  { id: 'smiley', label: 'Smiley' },
  { id: 'lightning', label: 'Lightning' },
  { id: 'sun', label: 'Sun' },
  { id: 'moon', label: 'Moon' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'donut', label: 'Donut' },
  { id: 'pie-quarter', label: 'Quarter Pie' },
  { id: 'pie-half', label: 'Half Pie' },
  { id: 'pie-three-quarter', label: '3/4 Pie' },
  { id: 'cylinder', label: 'Cylinder', supportsLabel: true },
  { id: 'cube', label: 'Cube', supportsLabel: true },
  { id: 'frame', label: 'Frame', supportsLabel: true },
  { id: 'folded-corner', label: 'Folded Corner', supportsLabel: true },
  { id: 'plaque', label: 'Plaque', supportsLabel: true },
  { id: 'bracket-left', label: 'Bracket Left' },
  { id: 'bracket-right', label: 'Bracket Right' },
  { id: 'callout', label: 'Callout', supportsLabel: true },
  { id: 'no-symbol', label: 'Prohibited' },
  { id: 'check', label: 'Check' },
  { id: 'x-mark', label: 'X Mark' },
]

export function renderShapeSvg(shapeType: ShapeType, props: ShapeRenderProps): ReactElement {
  const renderer = shapeRenderers[shapeType] || shapeRenderers.rect
  return renderer(props)
}

export function getShapeDefinition(shapeType: ShapeType | undefined): ShapeDefinition | null {
  if (!shapeType) return null
  const def = shapeCatalog.find(s => s.id === shapeType)
  return def || null
}

