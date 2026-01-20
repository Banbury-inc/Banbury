import { ReactElement } from 'react'
import type { StrokeStyle } from '../types/pptx-types'
import { getStrokeSVGAttributes } from '../utils/stroke-utils'

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
  stroke?: string | StrokeStyle
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

function getStrokeColor(stroke: string | StrokeStyle | undefined, fallback: string = '#1f2937'): string {
  if (!stroke) return fallback
  return typeof stroke === 'string' ? stroke : stroke.color
}

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

function renderCenteredText(text: string | undefined, fill: string, stroke?: string | StrokeStyle, size = 26): ReactElement | null {
  if (!text?.trim()) return null
  return (
    <text
      x="50"
      y="55"
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="Arial, sans-serif"
      fontSize={size}
      fill={getStrokeColor(stroke, '#1f2937')}
    >
      {text}
    </text>
  )
}

const shapeRenderers: Record<ShapeType, (props: ShapeRenderProps) => ReactElement> = {
  rect: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="100" fill={fill} {...strokeAttrs} />
      </svg>
    )
  },
  'round-rect': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="100" rx="14" ry="14" fill={fill} {...strokeAttrs} />
      </svg>
    )
  },
  'snip-top-right': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <path d="M0 0 H80 L100 20 V100 H0 Z" fill={fill} {...strokeAttrs} />
      </svg>
    )
  },
  'snip-top-left': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <path d="M20 0 H100 V100 H0 V20 Z" fill={fill} {...strokeAttrs} />
      </svg>
    )
  },
  'snip-top-both': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <path d="M20 0 H80 L100 20 V100 H0 V20 Z" fill={fill} {...strokeAttrs} />
      </svg>
    )
  },
  'parallelogram-right': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <polygon points="15,0 100,0 85,100 0,100" fill={fill} {...strokeAttrs} />
      </svg>
    )
  },
  'parallelogram-left': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <polygon points="0,0 85,0 100,100 15,100" fill={fill} {...strokeAttrs} />
      </svg>
    )
  },
  trapezoid: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points="15,0 85,0 100,100 0,100" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  chevron: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M0 0 L50 100 L100 0 L75 0 L50 60 L25 0 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  diamond: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points="50,0 100,50 50,100 0,50" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  pentagon: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points={regularPolygonPoints(5, 50)} fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  hexagon: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points={regularPolygonPoints(6, 50)} fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  octagon: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points={regularPolygonPoints(8, 50)} fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  decagon: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points={regularPolygonPoints(10, 50)} fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  dodecagon: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points={regularPolygonPoints(12, 50)} fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  circle: ({ fill, stroke, strokeWidth, text }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <circle cx="50" cy="50" r="50" fill={fill} {...strokeAttrs} />
        {renderCenteredText(text, fill, stroke, 26)}
      </svg>
    )
  },
  ellipse: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <ellipse cx="50" cy="50" rx="50" ry="50" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  triangle: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points="50,0 100,100 0,100" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'right-triangle': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points="0,0 100,0 0,100" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'arrow-right': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M0 35 H60 V15 L100 50 L60 85 V65 H0 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'arrow-left': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M100 35 H40 V15 L0 50 L40 85 V65 H100 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'arrow-up': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M65 100 V40 H85 L50 0 L15 40 H35 V100 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'arrow-down': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M65 0 V60 H85 L50 100 L15 60 H35 V0 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'double-arrow': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M15 35 L50 0 L85 35 H65 V65 H85 L50 100 L15 65 H35 V35 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'bent-arrow': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M0 15 H60 V0 L100 40 L60 80 V60 H20 V100 H0 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'curved-arrow': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path
        d="M75 0 C40 0 15 25 15 55 C15 72 27 87 45 92 L30 75 H60 L77 100 L60 115"
        fill="none"
        stroke={getStrokeColor(stroke, fill)}
        strokeWidth={strokeWidth || 4}
        strokeLinecap="round"
      />
      <path d="M68 2 L87 0 L90 20 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  line: ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <line x1="0" y1="50" x2="100" y2="50" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 4} />
    </svg>
  ),
  'line-diagonal': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <line x1="0" y1="100" x2="100" y2="0" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 4} />
    </svg>
  ),
  cross: ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <g stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 8}>
        <line x1="0" y1="50" x2="100" y2="50" />
        <line x1="50" y1="0" x2="50" y2="100" />
      </g>
    </svg>
  ),
  plus: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M40 0 H60 V40 H100 V60 H60 V100 H40 V60 H0 V40 H40 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'star-4': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points={starPoints(4, 50, 20)} fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'star-5': ({ fill, stroke, strokeWidth, text }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <polygon points={starPoints(5, 50, 20)} fill={fill} {...strokeAttrs} />
        {renderCenteredText(text, fill, stroke)}
      </svg>
    )
  },
  'star-6': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points={starPoints(6, 50, 20)} fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'star-7': ({ fill, stroke, strokeWidth, text }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <polygon points={starPoints(7, 50, 20)} fill={fill} {...strokeAttrs} />
        {renderCenteredText(text, fill, stroke)}
      </svg>
    )
  },
  'star-8': ({ fill, stroke, strokeWidth, text }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <polygon points={starPoints(8, 50, 20)} fill={fill} {...strokeAttrs} />
        {renderCenteredText(text, fill, stroke)}
      </svg>
    )
  },
  'star-10': ({ fill, stroke, strokeWidth, text }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <polygon points={starPoints(10, 50, 20)} fill={fill} {...strokeAttrs} />
        {renderCenteredText(text, fill, stroke)}
      </svg>
    )
  },
  'star-12': ({ fill, stroke, strokeWidth, text }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
        <polygon points={starPoints(12, 50, 20)} fill={fill} {...strokeAttrs} />
        {renderCenteredText(text, fill, stroke)}
      </svg>
    )
  },
  heart: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M50 100 L10 60 C0 45 5 15 25 5 C38 0 50 5 50 15 C50 5 62 0 75 5 C95 15 100 45 90 60 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  smiley: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    const strokeColor = getStrokeColor(stroke)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <circle cx="50" cy="50" r="50" fill={fill} {...strokeAttrs} />
      <circle cx="36" cy="44" r="4" fill={strokeColor} />
      <circle cx="64" cy="44" r="4" fill={strokeColor} />
      <path d="M32 60 Q50 74 68 60" fill="none" stroke={strokeColor} strokeWidth={strokeWidth ? Math.max(2, strokeWidth) : 3} strokeLinecap="round" />
    </svg>
  )
  },
  lightning: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M60 0 L10 60 H45 L30 100 L90 45 H60 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  sun: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <circle cx="50" cy="50" r="20" fill={fill} {...strokeAttrs} />
      <g stroke={getStrokeColor(stroke, fill)} strokeWidth={strokeWidth || 3} strokeLinecap="round">
        <line x1="50" y1="0" x2="50" y2="12" />
        <line x1="50" y1="82" x2="50" y2="94" />
        <line x1="0" y1="50" x2="12" y2="50" />
        <line x1="82" y1="50" x2="94" y2="50" />
        <line x1="20" y1="20" x2="30" y2="30" />
        <line x1="70" y1="70" x2="80" y2="80" />
        <line x1="80" y1="20" x2="70" y2="30" />
        <line x1="30" y1="70" x2="20" y2="80" />
      </g>
    </svg>
  )
  },
  moon: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M64 10 C44 12 30 28 30 50 C30 72 44 88 64 90 C50 84 42 70 42 50 C42 30 50 16 64 10 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  cloud: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M25 80 H85 C95 80 100 72 100 60 C100 48 90 40 80 40 C77 25 65 15 50 20 C40 8 20 12 15 28 C5 30 0 40 0 52 C0 68 12 80 25 80 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  donut: ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <circle cx="50" cy="50" r="40" fill="none" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 8} />
      <circle cx="50" cy="50" r="20" fill="none" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 8} />
    </svg>
  ),
  'pie-quarter': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M50 0 A50 50 0 0 1 100 50 H50 Z" fill={fill} {...strokeAttrs} />
      <circle cx="50" cy="50" r="50" fill="none" {...strokeAttrs} />
    </svg>
  )
  },
  'pie-half': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M50 0 A50 50 0 0 1 100 50 A50 50 0 0 1 50 100 Z" fill={fill} {...strokeAttrs} />
      <circle cx="50" cy="50" r="50" fill="none" {...strokeAttrs} />
    </svg>
  )
  },
  'pie-three-quarter': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M50 0 A50 50 0 0 1 100 50 A50 50 0 0 1 75 93 A50 50 0 0 1 0 50 Z" fill={fill} {...strokeAttrs} />
      <circle cx="50" cy="50" r="50" fill="none" {...strokeAttrs} />
    </svg>
  )
  },
  cylinder: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <ellipse cx="50" cy="12" rx="42" ry="12" fill={fill} {...strokeAttrs} />
      <rect x="8" y="12" width="84" height="76" fill={fill} {...strokeAttrs} />
      <ellipse cx="50" cy="88" rx="42" ry="12" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  cube: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <polygon points="20,15 65,0 100,20 55,35" fill={fill} {...strokeAttrs} />
      <polygon points="20,15 55,35 55,85 20,100" fill={fill} {...strokeAttrs} />
      <polygon points="55,35 100,20 100,70 55,85" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  frame: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" fillRule="evenodd">
      <path d="M0 0 H100 V100 H0 Z M20 20 V80 H80 V20 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'folded-corner': ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M0 0 H75 L100 25 V100 H0 Z M75 0 V25 H100" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  plaque: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M20 0 H80 C92 0 100 12 100 28 V72 C100 88 92 100 80 100 H20 C8 100 0 88 0 72 V28 C0 12 8 0 20 0 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'bracket-left': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M70 0 H30 V100 H70" fill="none" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 6} />
    </svg>
  ),
  'bracket-right': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M30 0 H70 V100 H30" fill="none" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 6} />
    </svg>
  ),
  callout: ({ fill, stroke, strokeWidth }) => {
    const strokeAttrs = getStrokeSVGAttributes(stroke, strokeWidth)
    return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M5 15 H95 V70 H65 L45 95 L40 70 H5 Z" fill={fill} {...strokeAttrs} />
    </svg>
  )
  },
  'no-symbol': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <circle cx="50" cy="50" r="40" fill="none" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 8} />
      <line x1="15" y1="15" x2="85" y2="85" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 8} />
    </svg>
  ),
  check: ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <path d="M10 50 L40 80 L90 20" fill="none" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'x-mark': ({ stroke, strokeWidth }) => (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="none">
      <line x1="15" y1="15" x2="85" y2="85" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 8} strokeLinecap="round" />
      <line x1="85" y1="15" x2="15" y2="85" stroke={getStrokeColor(stroke)} strokeWidth={strokeWidth || 8} strokeLinecap="round" />
    </svg>
  )
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

