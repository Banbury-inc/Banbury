import React from 'react'
import { textRenderer, checkboxRenderer } from 'handsontable/renderers'
import { isUrl } from '../utils/is-url'
import { formatDateDisplay } from '../utils/format-date-display'

interface CellRendererParams {
  cellTypeMeta: {[key: string]: { type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; source?: string[]; numericFormat?: { pattern?: string; culture?: string }; dateFormat?: string }}
  cellLinks: {[key: string]: string}
  setCellLinks: React.Dispatch<React.SetStateAction<{[key: string]: string}>>
  cellFormats: {[key: string]: {className?: string}}
  cellStyles: {[key: string]: React.CSSProperties}
  conditionalClassOverlay: {[key: string]: string}
  conditionalStyleOverlay: {[key: string]: React.CSSProperties}
  hotTableRef: React.RefObject<any>
  containerRef: React.RefObject<HTMLDivElement>
  setLinkPopover: React.Dispatch<React.SetStateAction<{row: number; col: number; url: string; position: {top: number; left: number}} | null>>
}

export function createCellRenderer(params: CellRendererParams) {
  const {
    cellTypeMeta,
    cellLinks,
    setCellLinks,
    cellFormats,
    cellStyles,
    conditionalClassOverlay,
    conditionalStyleOverlay,
    hotTableRef,
    containerRef,
    setLinkPopover
  } = params

  return (instance: any, td: HTMLTableCellElement, r: number, c: number, prop: any, value: any, cellProperties: any) => {
    const cellKey = `${r}-${c}`
    
    // Delegate to appropriate base renderer based on meta.type
    try {
      const meta = instance.getCellMeta(r, c) || {}
      // Re-apply persisted type meta if Handsontable meta was lost (similar to class/style persistence)
      const persisted = cellTypeMeta[cellKey]
      if (persisted && (!meta || meta.type !== persisted.type)) {
        try {
          instance.setCellMeta(r, c, 'type', persisted.type)
          if (persisted.type === 'dropdown' && Array.isArray(persisted.source)) {
            instance.setCellMeta(r, c, 'source', persisted.source)
            instance.setCellMeta(r, c, 'strict', false) // Allow typing custom values
          }
          if (persisted.type === 'numeric' && persisted.numericFormat) {
            instance.setCellMeta(r, c, 'numericFormat', persisted.numericFormat)
          }
          if (persisted.type === 'date' && persisted.dateFormat) {
            instance.setCellMeta(r, c, 'dateFormat', persisted.dateFormat)
          }
        } catch {}
      }
      const effectiveType = (persisted && persisted.type) ? persisted.type : meta.type
      
      if (effectiveType === 'checkbox') {
        checkboxRenderer(instance, td, r, c, prop, value, cellProperties)
      } else {
        textRenderer(instance, td, r, c, prop, value, cellProperties)
        // If this is a date cell, display only the date portion
        if (effectiveType === 'date') {
          try {
            const display = formatDateDisplay(value)
            td.textContent = display
          } catch {}
        }
      }
      
      // Auto-detect URL from cell value (only for non-checkbox cells)
      if (effectiveType !== 'checkbox') {
        const detectedUrl = isUrl(value)
        if (detectedUrl && !cellLinks[cellKey]) {
          setCellLinks(prev => ({ ...prev, [cellKey]: detectedUrl }))
        }
      }
    } catch {
      textRenderer(instance, td, r, c, prop, value, cellProperties)
      // Also check for URLs in catch block
      const detectedUrl = isUrl(value)
      if (detectedUrl && !cellLinks[cellKey]) {
        setCellLinks(prev => ({ ...prev, [cellKey]: detectedUrl }))
      }
    }
    
    const fmt = cellFormats[cellKey]
    const sty = cellStyles[cellKey]
    const cfClass = conditionalClassOverlay[cellKey]
    const cfStyle = conditionalStyleOverlay[cellKey]
    const storedLink = cellLinks[cellKey]
    const detectedUrl = isUrl(value)
    const linkUrl = storedLink || detectedUrl
    const existingClasses = td.className ? td.className.split(' ').filter(Boolean) : []
    let mergedClasses = [...existingClasses]
    if (fmt?.className) {
      const classes = fmt.className.split(' ').filter(cls => cls.trim())
      mergedClasses = classes
    }
    if (cfClass) {
      const add = cfClass.split(' ').filter(Boolean)
      mergedClasses = [...mergedClasses, ...add]
    }
    try {
      const metaForSearch = (instance as any).getCellMeta(r, c) || {}
      if (metaForSearch.isSearchResult) {
        if (!mergedClasses.includes('htSearchResult')) mergedClasses.push('htSearchResult')
      }
    } catch {}
    td.className = mergedClasses.join(' ')
    
    td.style.whiteSpace = 'nowrap'
    td.style.overflow = 'visible'
    td.style.textOverflow = 'clip'
    td.style.wordBreak = 'normal'
    td.style.setProperty('overflow-wrap', 'normal')

    if (sty && Object.keys(sty).length > 0) {
      const styleEntries = Object.entries(sty)
      for (const [prop, val] of styleEntries) {
        if (val != null) {
          try {
            // Convert camelCase to kebab-case for CSS property names
            const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
            td.style.setProperty(cssProperty, String(val))
          } catch {}
        }
      }
    }
    if (cfStyle && Object.keys(cfStyle).length > 0) {
      const entries = Object.entries(cfStyle)
      for (const [prop, val] of entries) {
        if (val != null) {
          try { 
            // Convert camelCase to kebab-case for CSS property names
            const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
            td.style.setProperty(cssProperty, String(val)) 
          } catch {}
        }
      }
    }
    
    // Handle link rendering AFTER all styling is applied
    // Check if this is a checkbox cell by checking the meta
    const isCheckboxCell = (() => {
      try {
        const meta = instance.getCellMeta(r, c) || {}
        const persisted = cellTypeMeta[cellKey]
        const cellType = (persisted && persisted.type) ? persisted.type : meta.type
        return cellType === 'checkbox'
      } catch {
        return false
      }
    })()
    
    // Check if cell is currently being edited - don't render link during editing
    const isEditing = (() => {
      try {
        const activeEditor = instance.getActiveEditor()
        const selected = instance.getSelected()
        if (selected && selected.length > 0) {
          const [selRow, selCol] = selected[0]
          return activeEditor && selRow === r && selCol === c
        }
        return false
      } catch {
        return false
      }
    })()
    
    // Only render link if not editing and not checkbox
    if (linkUrl && !isCheckboxCell && !isEditing) {
      // Store the original text content
      const cellText = value ? String(value) : linkUrl
      // Clear and create link element
      td.innerHTML = ''
      const linkElement = document.createElement('a')
      linkElement.href = linkUrl
      linkElement.target = '_blank'
      linkElement.rel = 'noopener noreferrer'
      linkElement.textContent = cellText
      // Use important styles to ensure link is visible
      linkElement.style.setProperty('text-decoration', 'underline', 'important')
      linkElement.style.setProperty('color', '#2563eb', 'important')
      linkElement.style.setProperty('cursor', 'pointer', 'important')
      linkElement.style.setProperty('display', 'inline-block', 'important')
      linkElement.style.setProperty('width', '100%', 'important')
      linkElement.style.setProperty('height', '100%', 'important')
      // Preserve any text color from cell styles, but ensure it's still visible as a link
      if (sty?.color) {
        linkElement.style.setProperty('color', String(sty.color), 'important')
      }
      linkElement.onclick = (e) => {
        e.preventDefault()
        // Get cell position for popover
        const rect = td.getBoundingClientRect()
        const hotInstance = hotTableRef.current?.hotInstance
        if (hotInstance) {
          // Select the cell first
          hotInstance.selectCell(r, c)
          
          // Find the scrollable container (handsontable-container-full)
          const scrollableContainer = td.closest('.handsontable-container-full') as HTMLElement
          const container = containerRef.current
          
          if (container && scrollableContainer) {
            const containerRect = container.getBoundingClientRect()
            
            // Calculate position relative to the container, positioned below the cell
            const relativeTop = rect.bottom - containerRect.top + 4
            const relativeLeft = rect.left - containerRect.left
            
            // Show popover after a brief delay to allow selection
            setTimeout(() => {
              setLinkPopover({
                row: r,
                col: c,
                url: linkUrl,
                position: {
                  top: relativeTop,
                  left: relativeLeft
                }
              })
            }, 10)
          }
        }
      }
      td.appendChild(linkElement)
    }
    // Add dropdown indicator class for dropdown cells (append after formatting classes)
    try {
      const metaForIndicator = instance.getCellMeta(r, c) || {}
      const persistedForIndicator = cellTypeMeta[cellKey]
      const typeForIndicator = (persistedForIndicator && persistedForIndicator.type) ? persistedForIndicator.type : metaForIndicator.type
      if (typeForIndicator === 'dropdown') {
        const currentClasses = td.className ? td.className.split(' ').filter(Boolean) : []
        if (!currentClasses.includes('ht-dropdown-indicator')) {
          currentClasses.push('ht-dropdown-indicator')
          td.className = currentClasses.join(' ')
        }
        
        // Apply value-based styling for dropdown cells
        const cellValue = value ? String(value).trim() : ''
        if (cellValue === 'Rejected') {
          td.style.backgroundColor = '#fee2e2'  // light red/pink
          td.style.color = '#991b1b'  // dark red text
        } else if (cellValue === 'Applied') {
          td.style.backgroundColor = '#fef3c7'  // light yellow/tan
          td.style.color = '#92400e'  // dark yellow/brown text
        }
      }
    } catch {}
    
    return td
  }
}
