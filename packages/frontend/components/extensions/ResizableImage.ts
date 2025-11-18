import { Image } from '@tiptap/extension-image'
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state'

// Standalone functions to avoid 'this' context issues
function addResizeHandlesToImage(imageContainer: HTMLElement) {
  // Ensure container tightly wraps the image
  const innerImg = imageContainer.querySelector('img') as HTMLImageElement | null
  if (innerImg) {
    // Force tight wrapping
    const rect = innerImg.getBoundingClientRect()
    imageContainer.style.position = 'relative'
    imageContainer.style.display = 'inline-block'
    imageContainer.style.width = rect.width ? `${rect.width}px` : 'auto'
    imageContainer.style.height = rect.height ? `${rect.height}px` : 'auto'
    imageContainer.style.lineHeight = '0'
    innerImg.style.display = 'block'
    innerImg.style.margin = '0'
  }
  
  const handles = ['top-left', 'top-right', 'bottom-right', 'bottom-left']
  
  handles.forEach(position => {
    const handle = document.createElement('div')
    handle.className = `image-resize-handle ${position}`
    handle.setAttribute('data-position', position)
    
    // Add some inline styles to make sure handles are visible
    handle.style.position = 'absolute'
    handle.style.width = '12px'
    handle.style.height = '12px'
    handle.style.backgroundColor = '#3b82f6'
    handle.style.border = '2px solid white'
    handle.style.borderRadius = '50%'
    handle.style.zIndex = '1000'
    // Position per-corner (anchor to exact corners)
    switch (position) {
      case 'top-left':
        handle.style.top = '0'
        handle.style.left = '0'
        handle.style.transform = 'translate(-50%, -50%)'
        handle.style.cursor = 'nw-resize'
        break
      case 'top-right':
        handle.style.top = '0'
        handle.style.right = '0'
        handle.style.transform = 'translate(50%, -50%)'
        handle.style.cursor = 'ne-resize'
        break
      case 'bottom-right':
        handle.style.bottom = '0'
        handle.style.right = '0'
        handle.style.transform = 'translate(50%, 50%)'
        handle.style.cursor = 'se-resize'
        break
      case 'bottom-left':
        handle.style.bottom = '0'
        handle.style.left = '0'
        handle.style.transform = 'translate(-50%, 50%)'
        handle.style.cursor = 'sw-resize'
        break
    }
    
    imageContainer.appendChild(handle)
  })
  
  // Force a repaint
  imageContainer.style.display = 'none'
  imageContainer.offsetHeight // Force reflow
  imageContainer.style.display = ''
}

function removeResizeHandlesFromImage(imageContainer: HTMLElement) {
  const handles = imageContainer.querySelectorAll('.image-resize-handle')
  handles.forEach(handle => handle.remove())
}

function removeResizeHandlesFromAllImages(editorDom: HTMLElement) {
  const images = editorDom.querySelectorAll('.image-resizable')
  images.forEach((imageContainer) => {
    removeResizeHandlesFromImage(imageContainer as HTMLElement)
  })
}

function ensureImageWrapped(img: HTMLImageElement): HTMLElement {
  if (img.closest('.image-resizable')) {
    return img.closest('.image-resizable') as HTMLElement
  }
  
  // Create a wrapper
  const wrapper = document.createElement('div')
  wrapper.className = 'image-resizable'
  wrapper.style.position = 'relative'
  wrapper.style.display = 'inline-block'
  wrapper.style.width = 'auto'
  img.parentNode?.insertBefore(wrapper, img)
  wrapper.appendChild(img)
  // Ensure img does not force wrapper to full width
  img.style.display = 'block'
  img.style.maxWidth = '100%'
  img.style.width = 'auto'
  img.style.height = 'auto'
  
  return wrapper
}

function setupMutationObserver(editorDom: HTMLElement) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            // Just ensure images are properly wrapped, but don't add handles
            if (element.tagName === 'IMG') {
              ensureImageWrapped(element as HTMLImageElement)
            }
            // Also check for images within added nodes
            const images = element.querySelectorAll('img')
            images.forEach((img) => {
              ensureImageWrapped(img as HTMLImageElement)
            })
          }
        })
      }
    })
  })

  observer.observe(editorDom, {
    childList: true,
    subtree: true
  })
}

function selectImageContainer(editorDom: HTMLElement, container: HTMLElement) {
  // Remove handles from all other images
  const allContainers = editorDom.querySelectorAll('.image-resizable')
  allContainers.forEach(el => {
    if (el !== container) {
      el.classList.remove('selected')
      removeResizeHandlesFromImage(el as HTMLElement)
    }
  })
  
  // Add selected class and resize handles to clicked image
  container.classList.add('selected')
  if (!container.querySelector('.image-resize-handle')) {
    addResizeHandlesToImage(container)
  }
}

function clearSelectedImages(editorDom: HTMLElement) {
  const selected = editorDom.querySelectorAll('.image-resizable.selected')
  selected.forEach(el => {
    el.classList.remove('selected')
    removeResizeHandlesFromImage(el as HTMLElement)
  })
}

function handleResizeStart(view: any, event: MouseEvent, handle: HTMLElement) {
  const position = handle.getAttribute('data-position')
  const image = handle.closest('.image-resizable')
  if (!image || !position) return

  const startX = event.clientX
  const startY = event.clientY
  const startWidth = (image as HTMLElement).offsetWidth
  const startHeight = (image as HTMLElement).offsetHeight
  const aspectRatio = startWidth / Math.max(1, startHeight)
  const dirX = position.includes('right') ? 1 : position.includes('left') ? -1 : 0
  const dirY = position.includes('bottom') ? 1 : position.includes('top') ? -1 : 0
  
  // UX: mimic Google Docs feel
  const originalUserSelect = document.body.style.userSelect
  const originalCursor = document.body.style.cursor
  document.body.style.userSelect = 'none'
  document.body.style.cursor = `${(position.includes('left') || position.includes('right')) ? 'e' : 'n'}-resize`
  
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    
    let newWidth = startWidth + dirX * deltaX
    let newHeight = startHeight + dirY * deltaY
    
    // Corner handles keep aspect ratio unless Shift is held
    if ((position.includes('left') || position.includes('right')) && (position.includes('top') || position.includes('bottom')) && !e.shiftKey) {
      // Choose dominant axis to maintain aspect ratio
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newWidth = startWidth + dirX * deltaX
        newHeight = newWidth / aspectRatio
      } else {
        newHeight = startHeight + dirY * deltaY
        newWidth = newHeight * aspectRatio
      }
    }
    
    // Edge handles: lock one dimension
    if (!(position.includes('left') || position.includes('right'))) newWidth = startWidth
    if (!(position.includes('top') || position.includes('bottom'))) newHeight = startHeight
    
    // Constraints
    newWidth = Math.max(40, Math.round(newWidth))
    newHeight = Math.max(40, Math.round(newHeight))
    
    const img = image.querySelector('img') as HTMLImageElement
    if (img) {
      ;(image as HTMLElement).style.width = `${newWidth}px`
      ;(image as HTMLElement).style.height = `${newHeight}px`
      // Force img to fill wrapper
      img.removeAttribute('width')
      img.removeAttribute('height')
      img.style.width = '100%'
      img.style.height = '100%'
    }
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = originalUserSelect
    document.body.style.cursor = originalCursor
    
    // Update the editor state with new dimensions
    const img = image.querySelector('img') as HTMLImageElement
    if (img) {
      // Persist on the underlying image node by resolving position via coords at image center
      try {
        const rect = (img as HTMLElement).getBoundingClientRect()
        const result = view.posAtCoords({ left: rect.left + rect.width / 2, top: rect.top + rect.height / 2 })
        if (result) {
          let pos = result.pos
          let node = view.state.doc.nodeAt(pos)
          if (!node || node.type.name !== 'image') {
            node = view.state.doc.nodeAt(pos - 1)
            if (node && node.type.name === 'image') pos = pos - 1
          }
          if (node && node.type.name === 'image') {
            const widthPx = (image as HTMLElement).offsetWidth
            const heightPx = (image as HTMLElement).offsetHeight
            const newAttrs = { ...node.attrs, width: widthPx, height: heightPx }
            let tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos))
            tr = tr.setNodeMarkup(pos, node.type, newAttrs, node.marks)
            view.dispatch(tr)
          }
        }
      } catch (err) {
        // ignore
      }
    }
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

export const ResizableImage = Image.extend({
  addProseMirrorPlugins() {
    const plugins = this.parent?.() || []
    
    return [
      ...plugins,
      new Plugin({
        key: new PluginKey('resizableImage'),
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              const target = event.target as HTMLElement
              if (target.classList.contains('image-resize-handle')) {
                event.preventDefault()
                handleResizeStart(view, event, target)
                return true
              }
              return false
            },
            click: (view, event) => {
              const target = event.target as HTMLElement
              const imageContainer = target.closest('.image-resizable') as HTMLElement | null
              
              if (imageContainer) {
                selectImageContainer(view.dom as HTMLElement, imageContainer)
                event.preventDefault()
                return true
              } else {
                clearSelectedImages(view.dom as HTMLElement)
              }
              return false
            },

          },
        },
        view: () => ({
          update: (view) => {
            // Ensure images are wrapped but don't add handles by default
            setTimeout(() => {
              const imgElements = view.dom.querySelectorAll('img')
              imgElements.forEach((img) => {
                ensureImageWrapped(img as HTMLImageElement)
              })
            }, 0)
          },
          destroy: () => {
            // Clean up mutation observer if needed
          }
        }),
      }),
      new Plugin({
        key: new PluginKey('resizableImageMutation'),
        view: () => ({
          update: (view) => {
            // Set up mutation observer to watch for new images
            if (!view.dom.hasAttribute('data-mutation-observer-setup')) {
              view.dom.setAttribute('data-mutation-observer-setup', 'true')
              setupMutationObserver(view.dom)
            }
          },
        }),
      }),
    ]
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) return {}
          return { height: attributes.height }
        },
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, title } = HTMLAttributes
    const widthAttr = HTMLAttributes.width
    const heightAttr = HTMLAttributes.height
    const widthPx = typeof widthAttr === 'number' ? `${widthAttr}px` : (widthAttr ? `${parseInt(widthAttr, 10)}px` : 'auto')
    const heightPx = typeof heightAttr === 'number' ? `${heightAttr}px` : (heightAttr ? `${parseInt(heightAttr, 10)}px` : 'auto')
    
    // Don't include resize handles by default - they will be added on click
    const result = [
      'div',
      { 
        class: 'image-resizable',
        style: `position: relative; display: inline-block; line-height: 0; width: ${widthPx}; height: ${heightPx};`
      },
      ['img', { src, alt, title, width: widthPx !== 'auto' ? parseInt(widthPx, 10) : undefined, height: heightPx !== 'auto' ? parseInt(heightPx, 10) : undefined, style: 'display: block; height: 100%; width: 100%; object-fit: contain;' }],
    ]
    
    return result
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImage: (options: { src: string; alt?: string; title?: string; width?: string; height?: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
