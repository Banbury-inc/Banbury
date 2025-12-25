import { useState, useCallback, useRef, useEffect } from 'react'

interface UseLeftPanelResizeProps {
  isFileSidebarCollapsed: boolean
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
}

const STORAGE_KEY = 'leftPanelWidth'

function getStoredWidth(defaultWidth: number): number {
  if (typeof window === 'undefined') return defaultWidth
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed) && parsed >= 200 && parsed <= 600) {
      return parsed
    }
  }
  return defaultWidth
}

function saveWidth(width: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, width.toString())
  }
}

export function useLeftPanelResize({
  isFileSidebarCollapsed,
  defaultWidth = 320,
  minWidth = 200,
  maxWidth = 600,
}: UseLeftPanelResizeProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => getStoredWidth(defaultWidth))
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(getStoredWidth(defaultWidth))

  // Reset width when panel is collapsed/expanded
  useEffect(() => {
    if (isFileSidebarCollapsed) {
      // Don't reset width when collapsing, just hide it
      return
    }
    // When expanding, use the last width or default
    if (leftPanelWidth === 0) {
      const storedWidth = getStoredWidth(defaultWidth)
      setLeftPanelWidth(storedWidth)
      resizeStartWidth.current = storedWidth
    }
  }, [isFileSidebarCollapsed, defaultWidth, leftPanelWidth])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartX.current = e.clientX
    resizeStartWidth.current = leftPanelWidth

    // Prevent text selection during resize
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
  }, [leftPanelWidth])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX.current
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, resizeStartWidth.current + deltaX)
      )
      setLeftPanelWidth(newWidth)
      saveWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing, minWidth, maxWidth])

  return {
    leftPanelWidth,
    isResizing,
    handleResizeStart,
  }
}

