import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void
  hideContextMenu: () => void
}

interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null)

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: []
  })
  const menuRef = useRef<HTMLDivElement>(null)

  const showContextMenu = (x: number, y: number, items: ContextMenuItem[]) => {
    setContextMenu({
      visible: true,
      x,
      y,
      items
    })
  }

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  // Close context menu when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideContextMenu()
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscapeKey)
      }
    }
  }, [contextMenu.visible])

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (contextMenu.visible && menuRef.current) {
      const menu = menuRef.current
      const rect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let { x, y } = contextMenu

      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10
      }

      if (x !== contextMenu.x || y !== contextMenu.y) {
        setContextMenu(prev => ({ ...prev, x, y }))
      }
    }
  }, [contextMenu.visible, contextMenu.x, contextMenu.y])

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu }}>
      {children}
      {contextMenu.visible && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-48 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          {contextMenu.items.map((item, index) => (
            <button
              key={index}
              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                item.disabled 
                  ? 'text-zinc-500 cursor-not-allowed' 
                  : item.destructive 
                    ? 'text-red-400 hover:text-red-300' 
                    : 'text-zinc-200 hover:text-white'
              }`}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick()
                  hideContextMenu()
                }
              }}
              disabled={item.disabled}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </ContextMenuContext.Provider>
  )
}

export function useContextMenu() {
  const context = useContext(ContextMenuContext)
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider')
  }
  return context
}
