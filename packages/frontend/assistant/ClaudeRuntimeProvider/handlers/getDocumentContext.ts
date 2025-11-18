// Import the function to get the current Tiptap editor
// We'll use a dynamic import to avoid circular dependencies
function getCurrentTiptapEditor(): any {
  try {
    // Try to get editor from the registered global reference
    if (typeof window !== 'undefined' && (window as any)._tiptapDocxEditors) {
      const editors = (window as any)._tiptapDocxEditors;
      // Return the most recently registered editor that's still active
      for (let i = editors.length - 1; i >= 0; i--) {
        const editor = editors[i];
        if (editor && typeof editor.getHTML === 'function' && !editor.isDestroyed) {
          return editor;
        }
      }
    }
    
    // Fallback: Try to find editor through DOM
    const documentEditors = Array.from(document.querySelectorAll('.ProseMirror[contenteditable="true"]'));
    for (const element of documentEditors) {
      // Skip if it's in a chat composer
      const isInChatComposer = element.closest('.bg-zinc-800') || 
                              element.closest('.min-h-16') ||
                              element.closest('[aria-label*="Message input"]');
      if (isInChatComposer) continue;
      
      // Check if it's a document editor
      const hasSimpleTiptapClass = element.classList.contains('simple-tiptap-editor') || 
                                   element.closest('.simple-tiptap-editor');
      const isInAITiptap = element.closest('.min-h-\\[600px\\]') || 
                          element.closest('.bg-card');
      const isInWordViewer = element.closest('[class*="MuiBox"]') || 
                            element.closest('.h-full.border-0.rounded-none');
      
      if (hasSimpleTiptapClass || isInAITiptap || isInWordViewer) {
        // Try to get editor instance from element
        if ((element as any).__editor) {
          return (element as any).__editor;
        }
        // Try to get from parent React component
        let current = element.parentElement;
        while (current) {
          const reactKeys = Object.keys(current).filter(key => key.startsWith('__react'));
          for (const key of reactKeys) {
            try {
              const reactInstance = (current as any)[key];
              if (reactInstance?.memoizedProps?.editor) {
                return reactInstance.memoizedProps.editor;
              }
              if (reactInstance?.stateNode?.editor) {
                return reactInstance.stateNode.editor;
              }
            } catch (e) {
              // Ignore errors when traversing React internals
            }
          }
          current = current.parentElement;
        }
      }
    }
  } catch (error) {
    console.error('[getDocumentContext] Error finding editor:', error);
  }
  
  return null;
}

export function getDocumentContext(): string {
  let documentContext = '';
  
  try {
    // First, try to get current unsaved content from the Tiptap editor
    const editor = getCurrentTiptapEditor();
    if (editor && typeof editor.getHTML === 'function') {
      const currentHtml = editor.getHTML();
      // Only include if it has substantial content
      if (currentHtml && currentHtml.trim().length > 20) {
        // Convert HTML to plain text for context (preserving structure)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentHtml;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        if (textContent.trim().length > 20) {
          documentContext = `\n\nCurrent document content:\n${textContent}`;
          console.log('[getDocumentContext] Got current editor content:', documentContext.slice(0, 200));
          return documentContext;
        }
      }
    }
    
    // Fallback: Check localStorage for pending document context (for backwards compatibility)
    documentContext = localStorage.getItem('pendingDocumentContext') || '';
    console.log('[getDocumentContext] Read pendingDocumentContext from localStorage:', documentContext.slice(0, 200));
    
    if (documentContext) {
      localStorage.removeItem('pendingDocumentContext'); // Clean up after reading
    } else {
      console.log('[getDocumentContext] No document context found');
    }
  } catch (error) {
    console.error('[getDocumentContext] Error getting document context:', error);
  }
  
  return documentContext;
}

