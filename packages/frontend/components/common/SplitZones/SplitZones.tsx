import React from 'react'

interface SplitZonesProps {
  isVisible: boolean
  mousePosition: { x: number; y: number } | null
}

export function SplitZones({ isVisible, mousePosition }: SplitZonesProps) {
  if (!isVisible || !mousePosition) return null

  // Check if mouse is within the main content area (middle panel)
  const mainElement = document.querySelector('main.h-full.bg-black.relative')
  if (!mainElement) return null

  const rect = mainElement.getBoundingClientRect()
  const isInMiddlePanel = mousePosition.x >= rect.left && mousePosition.x <= rect.right && 
                         mousePosition.y >= rect.top && mousePosition.y <= rect.bottom

  if (!isInMiddlePanel) return null

  // Use panel dimensions instead of viewport dimensions
  const panelWidth = rect.width
  const panelHeight = rect.height
  const edgeThreshold = Math.min(200, Math.min(panelWidth, panelHeight)) // 25% of smaller dimension, max 150px

  // Determine which zones are active based on mouse position relative to the panel
  const relativeX = mousePosition.x - rect.left
  const relativeY = mousePosition.y - rect.top
  
  const isNearLeftEdge = relativeX < edgeThreshold
  const isNearRightEdge = relativeX > panelWidth - edgeThreshold
  const isNearTopEdge = relativeY < edgeThreshold
  const isNearBottomEdge = relativeY > panelHeight - edgeThreshold

  return (
    <>
      {/* Center Cross Overlay removed: using original edge-based zones only */}
      {/* Left Zone */}
      {isNearLeftEdge && (
        <div 
          className="fixed bg-blue-500/10 border-r-2 border-blue-400/50 z-[9999] pointer-events-none transition-all duration-200 animate-in slide-in-from-left-2"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width / 2,
            height: rect.height,
          }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400 font-medium text-sm bg-gray-900/80 px-2 py-1 rounded">
            Split Left (Vertical)
          </div>
        </div>
      )}

      {/* Right Zone */}
      {isNearRightEdge && (
        <div 
          className="fixed bg-blue-500/10 border-l-2 border-blue-400/50 z-[9999] pointer-events-none transition-all duration-200 animate-in slide-in-from-right-2"
          style={{
            left: rect.right - rect.width / 2,
            top: rect.top,
            width: rect.width / 2,
            height: rect.height,
          }}
        >
          <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 text-blue-400 font-medium text-sm bg-gray-900/80 px-2 py-1 rounded">
            Split Right (Vertical)
          </div>
        </div>
      )}

      {/* Top Zone */}
      {isNearTopEdge && (
        <div 
          className="fixed bg-blue-500/10 border-b-2 border-blue-400/50 z-[9999] pointer-events-none transition-all duration-200 animate-in slide-in-from-top-2"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height / 2,
          }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400 font-medium text-sm bg-gray-900/80 px-2 py-1 rounded">
            Split Top (Horizontal)
          </div>
        </div>
      )}

      {/* Bottom Zone */}
      {isNearBottomEdge && (
        <div 
          className="fixed bg-blue-500/10 border-t-2 border-blue-400/50 z-[9999] pointer-events-none transition-all duration-200 animate-in slide-in-from-bottom-2"
          style={{
            left: rect.left,
            top: rect.bottom - rect.height / 2,
            width: rect.width,
            height: rect.height / 2,
          }}
        >
          <div className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-blue-400 font-medium text-sm bg-gray-900/80 px-2 py-1 rounded">
            Split Bottom (Horizontal)
          </div>
        </div>
      )}

      {/* No center zone indicators - only edge-based splits */}
      {/* Center indicators added above */}
    </>
  )
}
