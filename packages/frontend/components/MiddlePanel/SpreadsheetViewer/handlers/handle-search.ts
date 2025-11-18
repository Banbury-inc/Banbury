interface SearchHandlersParams {
  hotTableRef: React.RefObject<any>
  setIsSearchOpen: (open: boolean) => void
  setSearchText: (text: string) => void
  setResultCount: (count: number) => void
  matchesRef: React.MutableRefObject<Array<{ row: number; col: number }>>
  currentIndexRef: React.MutableRefObject<number>
}

export function createSearchHandlers({
  hotTableRef,
  setIsSearchOpen,
  setSearchText,
  setResultCount,
  matchesRef,
  currentIndexRef
}: SearchHandlersParams) {
  function openSearch() {
    setIsSearchOpen(true)
    // Deselect grid to avoid editing mode
    try {
      const hotInstance = hotTableRef.current?.hotInstance
      if (hotInstance?.deselectCell) hotInstance.deselectCell()
    } catch {}
  }

  function clearHighlights() {
    const hotInstance = hotTableRef.current?.hotInstance
    if (!hotInstance?.getPlugin) return
    const search = hotInstance.getPlugin('search')
    if (!search) return
    try {
      search.query('')
      hotInstance.render()
    } catch {}
  }

  function closeSearch() {
    setIsSearchOpen(false)
    setSearchText('')
    setResultCount(0)
  }

  function handleSearchOpen() {
    setIsSearchOpen(true)
  }

  function findNext() {
    if (matchesRef.current.length === 0) return
    const next = (currentIndexRef.current + 1) % matchesRef.current.length
    currentIndexRef.current = next
  }

  function findPrev() {
    if (matchesRef.current.length === 0) return
    const len = matchesRef.current.length
    const prev = (currentIndexRef.current - 1 + len) % len
    currentIndexRef.current = prev
  }

  function clearSearch() {
    clearHighlights()
    setSearchText('')
    setResultCount(0)
    matchesRef.current = []
    currentIndexRef.current = -1
  }

  return {
    openSearch,
    closeSearch,
    findNext,
    findPrev,
    clearSearch
  }
}


