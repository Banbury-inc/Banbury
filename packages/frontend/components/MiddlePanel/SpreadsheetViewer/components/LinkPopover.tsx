import React from 'react'
import { Link as LinkIcon, Edit as EditIcon, ContentCopy as CopyIcon, LinkOff as UnlinkIcon } from '@mui/icons-material'

interface LinkPopoverProps {
  linkPopover: {
    row: number
    col: number
    url: string
    position: { top: number; left: number }
  } | null
  onClose: () => void
  onEdit: (row: number, col: number, newUrl: string) => void
  onRemove: (row: number, col: number) => void
}

export function LinkPopover({ linkPopover, onClose, onEdit, onRemove }: LinkPopoverProps) {
  if (!linkPopover) return null

  const handleUrlClick = () => {
    window.open(linkPopover.url, '_blank', 'noopener,noreferrer')
    onClose()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(linkPopover.url)
    onClose()
  }

  const handleEdit = () => {
    const newUrl = window.prompt('Edit URL:', linkPopover.url)
    if (newUrl !== null && newUrl.trim()) {
      let normalizedUrl = newUrl.trim()
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = `https://${normalizedUrl}`
      }
      onEdit(linkPopover.row, linkPopover.col, normalizedUrl)
    }
    onClose()
  }

  const handleRemove = () => {
    onRemove(linkPopover.row, linkPopover.col)
    onClose()
  }

  return (
    <div
      data-link-popover
      style={{
        position: 'absolute',
        top: `${linkPopover.position.top}px`,
        left: `${linkPopover.position.left}px`,
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 10002,
        minWidth: 200,
        maxWidth: 400,
        pointerEvents: 'auto'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <LinkIcon sx={{ fontSize: 16, color: '#6b7280' }} />
      <span
        style={{
          flex: 1,
          color: '#2563eb',
          textDecoration: 'underline',
          fontSize: 13,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: 'pointer'
        }}
        onClick={handleUrlClick}
        title={linkPopover.url}
      >
        {linkPopover.url.length > 30 ? `${linkPopover.url.substring(0, 30)}...` : linkPopover.url}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={handleCopy}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 4
          }}
          title="Copy link"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <CopyIcon sx={{ fontSize: 16, color: '#6b7280' }} />
        </button>
        <button
          onClick={handleEdit}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 4
          }}
          title="Edit link"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <EditIcon sx={{ fontSize: 16, color: '#6b7280' }} />
        </button>
        <button
          onClick={handleRemove}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 4
          }}
          title="Remove link"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <UnlinkIcon sx={{ fontSize: 16, color: '#6b7280' }} />
        </button>
      </div>
    </div>
  )
}
