import { Maximize, Minus, SquareSquare, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../common/ui/button'

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
    <div className="flex h-full items-center">
      <Button
        variant="ghost"
        onClick={handleMinimize}
        className="w-[50px] p-0 rounded-none hover:bg-zinc-700/50 align-middle"
        title="Minimize"
      >
        <Minus />
      </Button>
      <Button
        variant="ghost"
        onClick={handleMaximize}
        className="w-[50px] p-0 rounded-none hover:bg-zinc-700/50 align-middle"
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <SquareSquare className="h-4 w-4" strokeWidth={1.5} />
        ) : (
          <Maximize className="h-4 w-4" strokeWidth={1.5} />
        )}
      </Button>
      <Button
        variant="ghost"
        onClick={handleClose}
        className="w-[50px] p-0 rounded-none hover:bg-red-500/20 hover:text-red-500 align-middle"
        title="Close"
      >
        <X />
      </Button>
    </div>
  )
}
