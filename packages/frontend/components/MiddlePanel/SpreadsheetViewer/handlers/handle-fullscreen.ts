interface FullscreenHandlerParams {
  containerRef: React.RefObject<HTMLDivElement>
}

export function createFullscreenHandler({ containerRef }: FullscreenHandlerParams) {
  let isFullscreen = false

  function toggleFullscreen() {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen()
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen()
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen()
      }
      isFullscreen = true
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen()
      }
      isFullscreen = false
    }
  }

  function getIsFullscreen() {
    return isFullscreen
  }

  // Listen for fullscreen change events to keep state in sync
  function setupListeners() {
    const handleFullscreenChange = () => {
      isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }

  return {
    toggleFullscreen,
    getIsFullscreen,
    setupListeners,
  }
}
