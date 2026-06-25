import React from 'react'

interface SearchOverlayProps {
  isOpen: boolean
  searchResultCount: number
  onSearchKeyUp: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

export function SearchOverlay({ isOpen, searchResultCount, onSearchKeyUp }: SearchOverlayProps) {
  if (!isOpen) return null

  return (
    <div
      className="csv-search-overlay absolute top-2 right-2 z-[1000] flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 shadow-md"
      role="dialog"
      aria-label="Search table"
    >
      <span className="min-w-16 text-center text-xs text-foreground">
        {searchResultCount > 0 ? `${searchResultCount} results` : 'No results'}
      </span>
      <input
        id="search_field"
        type="search"
        className="text-foreground bg-transparent"
        placeholder="Search"
        onKeyUp={onSearchKeyUp}
      />
    </div>
  )
}
