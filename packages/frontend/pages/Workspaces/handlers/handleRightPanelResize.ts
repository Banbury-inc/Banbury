import { useState, useCallback, useRef, useEffect } from 'react'

interface UseRightPanelResizeProps {
  isAssistantPanelCollapsed: boolean
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
}

const STORAGE_KEY = 'rightPanelWidth'

function getStoredWidth(defaultWidth: number): number {
  if (typeof window === 'undefined') return defaultWidth
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed) && parsed >= 280 && parsed <= 700)
      return parsed
  }
  return defaultWidth
}

function saveWidth(width: number): void {
  if (typeof window !== 'undefined')
    localStorage.setItem(STORAGE_KEY, width.toString())
}

export function useRightPanelResize({
  isAssistantPanelCollapsed,
  defaultWidth = 380,
  minWidth = 280,
  maxWidth = 700,
}: UseRightPanelResizeProps) {
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => getStoredWidth(defaultWidth))
  const [isAssistantResizing, setIsAssistantResizing] = useState(false)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(getStoredWidth(defaultWidth))

  useEffect(() => {
    if (isAssistantPanelCollapsed) return
    if (rightPanelWidth === 0) {
      const storedWidth = getStoredWidth(defaultWidth)
      setRightPanelWidth(storedWidth)
      resizeStartWidth.current = storedWidth
    }
  }, [isAssistantPanelCollapsed, defaultWidth, rightPanelWidth])

  const handleAssistantResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAssistantResizing(true)
    resizeStartX.current = e.clientX
    resizeStartWidth.current = rightPanelWidth
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
  }, [rightPanelWidth])

  useEffect(() => {
    if (!isAssistantResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX.current
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, resizeStartWidth.current - deltaX)
      )
      setRightPanelWidth(newWidth)
      saveWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsAssistantResizing(false)
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
  }, [isAssistantResizing, minWidth, maxWidth])

  return {
    rightPanelWidth,
    isAssistantResizing,
    handleAssistantResizeStart,
  }
}
