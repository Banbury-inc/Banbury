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
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        background: '#ffffff',
        border: '1px solid #1f2937',
        borderRadius: 6,
        boxShadow: '0 6px 16px rgba(0,0,0,0.16)',
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 1000
      }}
      className="csv-search-overlay"
      role="dialog"
      aria-label="Search table"
    >
      <span style={{ fontSize: 12, color: '#111827', minWidth: 64, textAlign: 'center' }}>
        {searchResultCount > 0 ? `${searchResultCount} results` : 'No results'}
      </span>
      <input
        id="search_field"
        type="search"
        style={{ color: '#111827' }}
        placeholder="Search"
        onKeyUp={onSearchKeyUp}
      />
    </div>
  )
}
