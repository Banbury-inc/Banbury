import { Minimize2, Maximize2, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Check if we're in the Electron desktop app
    const checkDesktop = typeof window !== 'undefined' && window.desktopApp?.isDesktop === true
    setIsDesktop(checkDesktop)

    if (!checkDesktop) return

    // Get initial maximize state
    window.desktopApp?.windowControls?.isMaximized().then(setIsMaximized)

    // Subscribe to maximize state changes
    const cleanup = window.desktopApp?.windowControls?.onMaximizeChanged((maximized) => {
      setIsMaximized(maximized)
    })

    return cleanup
  }, [])

  if (!isDesktop) return null

  const handleMinimize = () => {
    window.desktopApp?.windowControls?.minimizeWindow()
  }

  const handleMaximize = () => {
    window.desktopApp?.windowControls?.maximizeWindow()
  }

  const handleClose = () => {
    window.desktopApp?.windowControls?.closeWindow()
  }

  return (
    <div className="flex items-center gap-1 ml-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleMinimize}
        className="h-6 w-6 hover:bg-zinc-700/50"
        title="Minimize"
      >
        <Minimize2 className="h-3.5 w-3.5" strokeWidth={2} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleMaximize}
        className="h-6 w-6 hover:bg-zinc-700/50"
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <Square className="h-3 w-3" strokeWidth={2} />
        ) : (
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleClose}
        className="h-6 w-6 hover:bg-red-500/20 hover:text-red-500"
        title="Close"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </Button>
    </div>
  )
}
