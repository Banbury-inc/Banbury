import React from 'react'
import { SplitSquareHorizontal, SplitSquareVertical } from 'lucide-react'

interface SplitPreviewProps {
  direction: 'horizontal' | 'vertical' | null
  position: { x: number; y: number }
  isVisible: boolean
}

export function SplitPreview({ direction, position, isVisible }: SplitPreviewProps) {
  if (!isVisible || !direction) return null

  const getPreviewContent = () => {
    switch (direction) {
      case 'horizontal':
        return (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <SplitSquareHorizontal size={16} className="text-blue-400" />
              <span className="text-sm font-medium">Horizontal Split</span>
            </div>
            <div className="w-32 h-20 bg-gray-800 rounded border border-gray-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-transparent" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-400 transform -translate-y-1/2 animate-pulse" />
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gray-700/30 transition-all duration-300" />
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gray-700/30 transition-all duration-300" />
            </div>
          </div>
        )
      case 'vertical':
        return (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <SplitSquareVertical size={16} className="text-blue-400" />
              <span className="text-sm font-medium">Vertical Split</span>
            </div>
            <div className="w-32 h-20 bg-gray-800 rounded border border-gray-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent" />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-400 transform -translate-x-1/2 animate-pulse" />
              <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-gray-700/30 transition-all duration-300" />
              <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-gray-700/30 transition-all duration-300" />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className="fixed pointer-events-none z-[10000] bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-2xl border border-gray-700/50 transition-all duration-200 animate-in fade-in-0 zoom-in-95"
      style={{
        left: position.x + 15,
        top: position.y - 15,
        transform: 'translate(0, -100%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      {getPreviewContent()}
    </div>
  )
}
