export function handleKeyDown(
  e: KeyboardEvent,
  callbacks: {
    goToPreviousSlide: () => void
    goToNextSlide: () => void
    handleUndo: () => void
    handleRedo: () => void
    handleSave: () => void
  }
) {
  // Don't handle if typing in input
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true') {
    return
  }

  if (e.key === 'ArrowLeft') callbacks.goToPreviousSlide()
  if (e.key === 'ArrowRight') callbacks.goToNextSlide()
  
  // Undo/Redo shortcuts
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()
    if (e.shiftKey) {
      callbacks.handleRedo()
    } else {
      callbacks.handleUndo()
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()
    callbacks.handleRedo()
  }
  
  // Save shortcut
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    callbacks.handleSave()
  }
}
