import { useMemo } from 'react'
import type { JourneyPath } from '../../types/adminTypes'

interface JourneyFlowDiagramProps {
  paths: JourneyPath[]
  startingEvent: string
  onPathClick?: (path: JourneyPath) => void
}

const EVENT_COLORS: Record<string, string> = {
  'page_view': 'bg-blue-500',
  'navigation': 'bg-purple-500',
  'button_click': 'bg-orange-500',
  'file_open': 'bg-green-500',
  'tab_open': 'bg-pink-500',
  'default': 'bg-zinc-500'
}

const getEventColor = (eventName: string): string => {
  const lowerName = eventName.toLowerCase()
  if (lowerName.includes('view') || lowerName.includes('page')) return EVENT_COLORS['page_view']
  if (lowerName.includes('navigate') || lowerName.includes('→')) return EVENT_COLORS['navigation']
  if (lowerName.includes('click') || lowerName.includes('button')) return EVENT_COLORS['button_click']
  if (lowerName.includes('open file') || lowerName.includes('file')) return EVENT_COLORS['file_open']
  if (lowerName.includes('open') || lowerName.includes('tab')) return EVENT_COLORS['tab_open']
  return EVENT_COLORS['default']
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${minutes}m ${secs}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

export function JourneyFlowDiagram({ paths, startingEvent, onPathClick }: JourneyFlowDiagramProps) {
  const sortedPaths = useMemo(() => {
    return [...paths].sort((a, b) => b.userCount - a.userCount)
  }, [paths])

  const maxPathLength = useMemo(() => {
    return Math.max(...paths.map(p => p.path.length), 0)
  }, [paths])

  const boxWidth = 140
  const boxHeight = 80
  const horizontalSpacing = 20
  const verticalSpacing = 100
  const startX = 20
  const startY = 60

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full" style={{ minHeight: `${sortedPaths.length * verticalSpacing + 100}px` }}>
        <svg
          width="100%"
          height={sortedPaths.length * verticalSpacing + 100}
          className="border border-zinc-200 dark:border-white/[0.06] rounded-lg bg-background"
        >
          {/* Starting Event Box */}
          <g>
            <rect
              x={startX}
              y={startY - 30}
              width={boxWidth}
              height={boxHeight}
              rx={8}
              fill="rgb(59, 130, 246)"
              stroke="rgb(37, 99, 235)"
              strokeWidth={2}
              className="shadow-md"
            />
            <text
              x={startX + boxWidth / 2}
              y={startY + 10}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="600"
              className="pointer-events-none"
            >
              {startingEvent}
            </text>
          </g>

          {/* Paths */}
          {sortedPaths.map((path, pathIndex) => {
            const y = startY + pathIndex * verticalSpacing
            const pathEvents = path.path.slice(1) // Skip first event (starting event)
            
            return (
              <g key={pathIndex}>
                {/* Horizontal line from starting event */}
                <line
                  x1={startX + boxWidth}
                  y1={startY + boxHeight / 2}
                  x2={startX + boxWidth + 20}
                  y2={y + boxHeight / 2}
                  stroke="rgb(161, 161, 170)"
                  strokeWidth={2}
                  markerEnd="url(#arrowhead)"
                />

                {/* Path statistics text */}
                <text
                  x={startX + boxWidth + 30}
                  y={y - 10}
                  fill="rgb(113, 113, 122)"
                  fontSize="11"
                  fontWeight="500"
                >
                  {path.percentage.toFixed(1)}% • {path.userCount} Users • Avg: {formatDuration(path.averageDuration)}
                </text>

                {/* Event boxes in path */}
                {pathEvents.map((event, eventIndex) => {
                  const x = startX + boxWidth + 60 + eventIndex * (boxWidth + horizontalSpacing)
                  const eventColor = getEventColor(event)
                  
                  return (
                    <g key={eventIndex}>
                      {/* Arrow from previous event */}
                      {eventIndex > 0 && (
                        <line
                          x1={x - horizontalSpacing}
                          y1={y + boxHeight / 2}
                          x2={x}
                          y2={y + boxHeight / 2}
                          stroke="rgb(161, 161, 170)"
                          strokeWidth={2}
                          markerEnd="url(#arrowhead)"
                        />
                      )}

                      {/* Event box */}
                      <rect
                        x={x}
                        y={y}
                        width={boxWidth}
                        height={boxHeight}
                        rx={8}
                        fill={eventColor}
                        stroke="rgb(37, 99, 235)"
                        strokeWidth={1}
                        className="shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onPathClick?.(path)}
                      />
                      <text
                        x={x + boxWidth / 2}
                        y={y + boxHeight / 2 + 5}
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="500"
                        className="pointer-events-none"
                      >
                        {event.length > 20 ? `${event.substring(0, 17)}...` : event}
                      </text>

                      {/* "More" indicator if path continues */}
                      {eventIndex === pathEvents.length - 1 && eventIndex < maxPathLength - 2 && (
                        <g>
                          <line
                            x1={x + boxWidth}
                            y1={y + boxHeight / 2}
                            x2={x + boxWidth + 20}
                            y2={y + boxHeight / 2}
                            stroke="rgb(161, 161, 170)"
                            strokeWidth={2}
                            markerEnd="url(#arrowhead)"
                          />
                          <text
                            x={x + boxWidth + 30}
                            y={y + boxHeight / 2 + 5}
                            fill="rgb(113, 113, 122)"
                            fontSize="10"
                            fontWeight="500"
                          >
                            More
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="rgb(161, 161, 170)"
              />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span>Page View</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500"></div>
          <span>Navigation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span>Button Click</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>File Open</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-pink-500"></div>
          <span>Tab Open</span>
        </div>
      </div>
    </div>
  )
}
