/**
 * Side-effect-free version of getDocumentContext.
 * Used for live context budget estimation without consuming the localStorage value.
 */

function getCurrentTiptapEditorContent(): string {
  try {
    // Try to get editor from the registered global reference
    if (typeof window !== 'undefined' && (window as any)._tiptapDocxEditors) {
      const editors = (window as any)._tiptapDocxEditors
      // Return the most recently registered editor that's still active
      for (let i = editors.length - 1; i >= 0; i--) {
        const editor = editors[i]
        if (editor && typeof editor.getHTML === 'function' && !editor.isDestroyed) {
          const currentHtml = editor.getHTML()
          if (currentHtml && currentHtml.trim().length > 20) {
            // Convert HTML to plain text for context (preserving structure)
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = currentHtml
            const textContent = tempDiv.textContent || tempDiv.innerText || ''
            if (textContent.trim().length > 20) {
              return textContent
            }
          }
        }
      }
    }
    
    // Fallback: Look for document editor content through DOM
    const documentEditors = Array.from(document.querySelectorAll('.ProseMirror[contenteditable="true"]'))
    
    for (const element of documentEditors) {
      // Skip if it's in a chat composer
      const isInChatComposer = element.closest('.bg-zinc-800') || 
                              element.closest('.min-h-16') ||
                              element.closest('[aria-label*="Message input"]')
      if (isInChatComposer) continue
      
      // Check if it's a document editor
      const hasSimpleTiptapClass = element.classList.contains('simple-tiptap-editor') || 
                                   element.closest('.simple-tiptap-editor')
      const isInAITiptap = element.closest('.min-h-\\[600px\\]') || 
                          element.closest('.bg-card')
      const isInWordViewer = element.closest('[class*="MuiBox"]') || 
                            element.closest('.h-full.border-0.rounded-none')
      
      if (hasSimpleTiptapClass || isInAITiptap || isInWordViewer) {
        // Try to get HTML from editor instance if available
        let content = ''
        if ((element as any).__editor && typeof (element as any).__editor.getHTML === 'function') {
          const html = (element as any).__editor.getHTML()
          if (html) {
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = html
            content = tempDiv.textContent || tempDiv.innerText || ''
          }
        } else {
          // Fallback to textContent
          content = element.textContent || ''
        }
        
        if (content.trim() && content.length > 20) {
          return content
        }
      }
    }
  } catch (error) {
    console.error('[getDocumentContextPreview] Error finding editor content:', error)
  }
  
  return ''
}

export function getDocumentContextPreview(): string {
  // First try to get live editor content
  const editorContent = getCurrentTiptapEditorContent()
  if (editorContent) {
    return `\n\nCurrent document content:\n${editorContent}`
  }
  
  // Fallback: peek at localStorage without removing
  try {
    const stored = localStorage.getItem('pendingDocumentContext')
    if (stored) {
      return stored
    }
  } catch {
    // Ignore localStorage errors
  }
  
  return ''
}

