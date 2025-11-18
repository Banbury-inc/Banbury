/**
 * Handler for DOCX AI tool responses
 * This handles the structured document operations returned by the docx_ai tool
 */

import { createStructuredHtmlDiff } from '../../../utils/htmlDiff';

interface DocxOperation {
  type: 'insertText' | 'replaceText' | 'insertParagraph' | 'replaceParagraph' | 'insertHeading' | 'replaceHeading' | 'insertList' | 'insertTable' | 'formatText' | 'insertImage' | 'setPageSettings' | 'insert';
  [key: string]: any;
}

interface DocxAIResponse {
  action: string;
  documentName?: string;
  operations?: DocxOperation[];
  htmlContent?: string;
  note?: string;
  preview?: boolean;
}

// Global reference to current editor from TiptapAIContext
let currentTiptapEditor: any = null;
let originalContent: string | null = null;
let isPreviewActive: boolean = false;
let lastAppliedContent: string | null = null;
let isAccepting: boolean = false; // Guard to prevent multiple accept operations

// Function to be called by TiptapAIContext to register the current editor
export function setCurrentTiptapEditor(editor: any) {
  currentTiptapEditor = editor;
}

// Function to check if we're currently showing a preview
export function isShowingPreview(): boolean {
  return isPreviewActive;
}

export function handleDocxAIResponse(payload: DocxAIResponse) {
  
  // Find the active Tiptap editor instance
  let editorInstance = currentTiptapEditor;
  
  // Fallback to the old method if no editor is registered via context
  if (!editorInstance) {
    editorInstance = findActiveTiptapEditor();
  }
  
  if (!editorInstance) {
    console.warn('No active Tiptap editor found');
    return;
  }
  
  // If preview is false and we're already in preview mode, this is an accept action
  // Don't show a new diff, let the accept handler process it
  // Also check if we have pending content/operations - if so, this is an accept, not a new preview
  // Also check if we're currently accepting to prevent race conditions
  if (payload.preview === false && (isAccepting || isPreviewActive || (editorInstance as any)._pendingHtmlContent || (editorInstance as any)._pendingOperations)) {
    // The accept handler will be triggered by the event listener
    return;
  }
  
  try {
    if (payload.htmlContent && payload.htmlContent.trim().length > 0) {
      // Always show diff view for htmlContent, regardless of preview flag
      // Store original content if this is the first preview
      if (!isPreviewActive) {
        originalContent = editorInstance.getHTML();
      }
      
      // Show diff preview
      const currentContent = originalContent || editorInstance.getHTML();
      const diffHtml = createStructuredHtmlDiff(currentContent, payload.htmlContent);
      
      // Mark that we're in preview mode (this prevents saving via isShowingPreview())
      isPreviewActive = true;
      
      // Store the htmlContent so we can apply it when user accepts
      (editorInstance as any)._pendingHtmlContent = payload.htmlContent;
      
      // Set the diff content in the editor
      editorInstance.chain().focus().setContent(diffHtml).run();
    } else if (payload.operations && payload.operations.length > 0) {
      // For operations, we need to convert them to HTML first to show diff
      // Store original content if this is the first preview
      if (!isPreviewActive) {
        originalContent = editorInstance.getHTML();
      }
      
      // For operations, apply them temporarily to get resulting HTML, then show diff
      const currentContent = originalContent || editorInstance.getHTML();
      
      // Apply operations temporarily to get the resulting HTML
      // We'll restore the original content after getting the HTML
      const newHtml = applyOperationsToGetHtml(editorInstance, currentContent, payload.operations);
      
      // Show diff preview
      const diffHtml = createStructuredHtmlDiff(currentContent, newHtml);
      
      // Mark that we're in preview mode
      isPreviewActive = true;
      
      // Store the operations so we can apply them when user accepts
      (editorInstance as any)._pendingOperations = payload.operations;
      
      // Set the diff content in the editor
      editorInstance.chain().focus().setContent(diffHtml).run();
    } else {
      console.warn('No valid content or operations provided in payload');
      return;
    }
  } catch (error) {
    console.error('Error applying DOCX operations:', error);
  }
}

// Listen for reject events to restore original content
if (typeof window !== 'undefined') {
  window.addEventListener('docx-ai-response-reject', () => {
    if (currentTiptapEditor && originalContent && isPreviewActive) {
      currentTiptapEditor.commands.setContent(originalContent);
      originalContent = null;
      isPreviewActive = false;
      lastAppliedContent = null;
      if ((currentTiptapEditor as any)._pendingOperations) {
        delete (currentTiptapEditor as any)._pendingOperations;
      }
      if ((currentTiptapEditor as any)._pendingHtmlContent) {
        delete (currentTiptapEditor as any)._pendingHtmlContent;
      }
    }
  });
  
  // Function to handle accepting changes
  const handleAcceptChanges = () => {
    if (!currentTiptapEditor || isAccepting) return
    
    // Check if we're actually in preview mode or have pending changes
    const pendingOperations = (currentTiptapEditor as any)._pendingOperations;
    const pendingHtmlContent = (currentTiptapEditor as any)._pendingHtmlContent;
    
    if (!isPreviewActive && !pendingHtmlContent && (!pendingOperations || pendingOperations.length === 0)) {
      // Nothing to accept
      return;
    }
    
    // Set accepting flag to prevent re-entry
    isAccepting = true
    
    // Clear preview state immediately to prevent handleDocxAIResponse from processing
    isPreviewActive = false
    
    if (pendingHtmlContent) {
      // Apply clean htmlContent directly (replaces diff content with clean version)
      // Don't restore originalContent first - just apply the clean new content
      // applyHtmlContentToTiptap already strips diff markup, so the content will be clean
      applyHtmlContentToTiptap(currentTiptapEditor, pendingHtmlContent);
      lastAppliedContent = pendingHtmlContent;
      delete (currentTiptapEditor as any)._pendingHtmlContent;
      // No need to strip diff markup again - we just applied clean content
    } else if (pendingOperations && pendingOperations.length > 0) {
      // For operations, we need to restore original first, then apply operations
      if (originalContent) {
        currentTiptapEditor.chain().focus().setContent(originalContent, { emitUpdate: false }).run();
      }
      applyTiptapOperations(currentTiptapEditor, pendingOperations);
      delete (currentTiptapEditor as any)._pendingOperations;
      
      // Ensure any remaining diff markup is removed from the editor after applying operations
      const currentHtml = currentTiptapEditor.getHTML()
      const cleanedHtml = stripDiffMarkup(currentHtml)
      if (currentHtml !== cleanedHtml) {
        currentTiptapEditor.chain().focus().setContent(cleanedHtml, { emitUpdate: false }).run()
      }
    }
    
    // Clear preview state variables
    originalContent = null;
    
    // Reset accepting flag after a short delay
    setTimeout(() => {
      isAccepting = false
    }, 100);
    
    // Clear the last applied content after a delay to allow future applications
    if (lastAppliedContent) {
      setTimeout(() => {
        lastAppliedContent = null;
      }, 1000);
    }
  }
  
  // Listen for accept events to apply pending operations
  window.addEventListener('docx-ai-response-accept', handleAcceptChanges);
  
  // Also listen for docx-ai-response with preview: false (dispatched by AIToolCard)
  window.addEventListener('docx-ai-response', ((event: CustomEvent) => {
    const payload = event.detail as DocxAIResponse
    // If preview is explicitly false and we have pending changes, treat as accept
    if (payload.preview === false) {
      const hasPendingContent = currentTiptapEditor && (
        isPreviewActive || 
        (currentTiptapEditor as any)._pendingHtmlContent || 
        ((currentTiptapEditor as any)._pendingOperations && (currentTiptapEditor as any)._pendingOperations.length > 0)
      )
      if (hasPendingContent) {
        handleAcceptChanges()
      }
    }
  }) as EventListener);
}

function findActiveTiptapEditor() {
  
  // Strategy 1: Check global registry (most reliablec)
  if (typeof window !== 'undefined' && (window as any)._tiptapDocxEditors) {
    const editors = (window as any)._tiptapDocxEditors;
    // Return the most recently registered editor that's still active
    for (let i = editors.length - 1; i >= 0; i--) {
      const editor = editors[i];
      if (editor && typeof editor.chain === 'function' && !editor.isDestroyed) {
        return editor;
      }
    }
  } else {
    console.log('No editor registry found');
  }
  
  // Strategy 2: Check for common global editor variable names
  if (typeof window !== 'undefined') {
    const globalNames = ['editor', 'tiptapEditor', 'documentEditor', 'aiEditor'];
    for (const name of globalNames) {
      const globalEditor = (window as any)[name];
      if (globalEditor && typeof globalEditor.chain === 'function' && !globalEditor.isDestroyed) {
        return globalEditor;
      }
    }
  }
  
  // Strategy 3: Try to find editor through DOM elements
  const tiptapElements = document.querySelectorAll('.ProseMirror');
  
  for (let i = 0; i < tiptapElements.length; i++) {
    const element = tiptapElements[i] as HTMLElement;
    
    // Skip chat composer elements
    const isInChatComposer = element.closest('.bg-zinc-800') || element.closest('.min-h-16');
    if (isInChatComposer) {
      continue;
    }
    
    // Try to get editor instance from the element
    const editorInstance = getEditorFromElement(element);
    if (editorInstance) {
      return editorInstance;
    }
  }
  
  return null;
}

// Utility function to register editor instances globally
// This should be called from Tiptap editor components
export function registerTiptapEditor(editor: any) {
  if (typeof window !== 'undefined') {
    if (!(window as any)._tiptapDocxEditors) {
      (window as any)._tiptapDocxEditors = [];
    }
    (window as any)._tiptapDocxEditors.push(editor);
    
    // Clean up destroyed editors
    (window as any)._tiptapDocxEditors = (window as any)._tiptapDocxEditors.filter(
      (e: any) => e && !e.isDestroyed
    );
  }
}

// Utility function to unregister editor instances
export function unregisterTiptapEditor(editor: any) {
  if (typeof window !== 'undefined' && (window as any)._tiptapDocxEditors) {
    (window as any)._tiptapDocxEditors = (window as any)._tiptapDocxEditors.filter(
      (e: any) => e !== editor
    );
  }
}

function getEditorFromElement(element: HTMLElement) {
  // Try different ways to get the editor instance from DOM element
  
  // Check for editor instance stored on the element itself
  if ((element as any).__editor) {
    return (element as any).__editor;
  }
  
  if ((element as any).editor) {
    return (element as any).editor;
  }
  
  // Check parent elements for React/Vue component instances with editor
  let current = element.parentElement;
  while (current) {
    // React components often store references in _reactInternalInstance or similar
    const reactKeys = Object.keys(current).filter(key => key.startsWith('__react'));
    for (const key of reactKeys) {
      try {
        const reactInstance = (current as any)[key];
        if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.editor) {
          return reactInstance.memoizedProps.editor;
        }
        if (reactInstance && reactInstance.stateNode && reactInstance.stateNode.editor) {
          return reactInstance.stateNode.editor;
        }
      } catch (e) {
        // Ignore errors when traversing React internals
      }
    }
    
    // Check for Vue instances
    if ((current as any).__vue__ && (current as any).__vue__.editor) {
      return (current as any).__vue__.editor;
    }
    
    current = current.parentElement;
  }
  
  return null;
}

/**
 * Strips all diff markup (insertion/deletion spans and classes) from HTML content
 */
function stripDiffMarkup(html: string): string {
  if (!html) return html
  
  // Create a temporary DOM element to parse and clean the HTML
  const div = document.createElement('div')
  div.innerHTML = html
  
  // Remove all elements with diff classes or data-diff attributes
  const diffElements = div.querySelectorAll('[class*="diff-insertion"], [class*="diff-deletion"], [data-diff]')
  diffElements.forEach(el => {
    // Replace the element with its children (preserving content but removing diff markup)
    const parent = el.parentNode
    if (parent) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el)
      }
      parent.removeChild(el)
    }
  })
  
  // Also remove diff classes from remaining elements
  const allElements = div.querySelectorAll('[class]')
  allElements.forEach(el => {
    const classList = el.classList
    if (classList.contains('diff-insertion') || classList.contains('diff-deletion')) {
      classList.remove('diff-insertion', 'diff-deletion')
    }
    // Remove data-diff attributes
    if (el.hasAttribute('data-diff')) {
      el.removeAttribute('data-diff')
    }
  })
  
  return div.innerHTML
}

function applyHtmlContentToTiptap(editor: any, htmlContent: string) {
  // Strip any diff markup that might be in the content
  const cleanHtml = stripDiffMarkup(htmlContent)
  
  // Use Tiptap's setContent command to replace entire content
  // Reference: https://tiptap.dev/docs/editor/api/commands/content
  
  try {
    const result = editor.chain().focus().setContent(cleanHtml).run();
  } catch (error) {
    console.error('Error setting Tiptap content:', error);
    // Fallback to clearContent and insertContent
    try {
      editor.chain().focus().clearContent().insertContent(cleanHtml).run();
    } catch (fallbackError) {
      console.error('Fallback content setting also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

function applyTiptapOperations(editor: any, operations: DocxOperation[]) {
  // Apply operations using Tiptap's command API
  // Each operation uses the appropriate Tiptap command
  
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    try {
      switch (operation.type) {
        case 'insertText':
          insertTextWithTiptap(editor, operation.position, operation.text);
          break;
        case 'replaceText':
          replaceTextWithTiptap(editor, operation.startPosition, operation.endPosition, operation.text);
          break;
        case 'insertParagraph':
          insertParagraphWithTiptap(editor, operation.position, operation.text, operation.style);
          break;
        case 'replaceParagraph':
          replaceParagraphWithTiptap(editor, operation.paragraphIndex, operation.text, operation.style);
          break;
        case 'insertHeading':
          insertHeadingWithTiptap(editor, operation.position, operation.text, operation.level);
          break;
        case 'replaceHeading':
          replaceHeadingWithTiptap(editor, operation.headingIndex, operation.text, operation.level);
          break;
        case 'insertList':
          insertListWithTiptap(editor, operation.position, operation.items, operation.listType);
          break;
        case 'insertTable':
          insertTableWithTiptap(editor, operation.position, operation.rows, operation.hasHeaders);
          break;
        case 'formatText':
          formatTextWithTiptap(editor, operation.startPosition, operation.endPosition, operation.formatting);
          break;
        case 'insertImage':
          insertImageWithTiptap(editor, operation.position, operation.imageUrl, operation.alt, operation.width, operation.height);
          break;
        case 'setPageSettings':
          // Page settings don't have direct Tiptap equivalents, so we'll skip these
          console.log('Page settings operations are not supported in Tiptap:', operation);
          break;
        case 'insert':
          // Handle generic 'insert' operation by trying to determine the best approach
          // This is a fallback for when the AI uses a generic insert instead of specific types
          if (operation.text) {
            // If we have text, insert it as text content
            insertTextWithTiptap(editor, operation.position || editor.state.selection.from, operation.text);
          } else if (operation.content) {
            // If we have HTML content, insert it directly
            try {
              const position = operation.position || editor.state.selection.from;
              editor.chain().focus().insertContentAt(position, operation.content).run();
            } catch (error) {
              editor.chain().focus().insertContent(operation.content).run();
            }
          } else {
            console.warn('Generic insert operation without text or content:', operation);
          }
          break;
        default:
          console.warn('Unknown operation type:', operation.type, 'Full operation:', operation);
      }
    } catch (error) {
      console.error(`Error applying Tiptap operation ${operation.type}:`, error);
    }
  }
}

// Tiptap-specific operation functions using the proper API
// Reference: https://tiptap.dev/docs/editor/api/commands/content

function insertTextWithTiptap(editor: any, position: number, text: string) {
  // Use Tiptap's insertContentAt command to insert text at specific position
  try {
    editor.chain().focus().insertContentAt(position, text).run();
  } catch (error) {
    // Fallback: just insert at current cursor position
    editor.chain().focus().insertContent(text).run();
  }
}

function replaceTextWithTiptap(editor: any, startPosition: number, endPosition: number, text: string) {
  // Set selection range and replace with new text
  try {
    editor.chain()
      .focus()
      .setTextSelection({ from: startPosition, to: endPosition })
      .insertContent(text)
      .run();
  } catch (error) {
    console.error('Error replacing text with Tiptap:', error);
  }
}

function insertParagraphWithTiptap(editor: any, position: number, text: string, style?: string) {
  // Insert a paragraph at the specified position
  const paragraphContent = `<p>${text}</p>`;
  try {
    editor.chain().focus().insertContentAt(position, paragraphContent).run();
  } catch (error) {
    // Fallback: insert at current position
    editor.chain().focus().insertContent(paragraphContent).run();
  }
}

function replaceParagraphWithTiptap(editor: any, paragraphIndex: number, text: string, style?: string) {
  // This is complex in Tiptap - we'll find the paragraph and replace its content
  // For now, we'll just insert a new paragraph
  const paragraphContent = `<p>${text}</p>`;
  editor.chain().focus().insertContent(paragraphContent).run();
}

function insertHeadingWithTiptap(editor: any, position: number, text: string, level: number) {
  // Insert heading using Tiptap's heading command
  const headingLevel = Math.min(Math.max(level, 1), 6);
  const headingContent = `<h${headingLevel}>${text}</h${headingLevel}>`;
  
  try {
    editor.chain().focus().insertContentAt(position, headingContent).run();
  } catch (error) {
    // Fallback: insert at current position
    editor.chain().focus().insertContent(headingContent).run();
  }
}

function replaceHeadingWithTiptap(editor: any, headingIndex: number, text: string, level?: number) {
  // Find all heading nodes in the document
  const headings: Array<{ pos: number; node: any }> = []
  
  editor.state.doc.descendants((node: any, pos: number) => {
    if (node.type && node.type.name === 'heading') {
      headings.push({ pos, node })
    }
    return true
  })
  
  // Check if headingIndex is valid
  if (headingIndex < 0 || headingIndex >= headings.length) {
    console.warn(`Invalid heading index ${headingIndex}. Document has ${headings.length} headings.`)
    return
  }
  
  const targetHeading = headings[headingIndex]
  const { pos, node } = targetHeading
  
  // If text is empty, remove the heading by converting it to a paragraph
  if (!text || text.trim().length === 0) {
    try {
      editor.chain()
        .focus()
        .setTextSelection({ from: pos, to: pos + node.nodeSize })
        .setNode('paragraph')
        .run()
    } catch (error) {
      console.error('Error removing heading:', error)
      // Fallback: delete the heading node
      try {
        editor.chain()
          .focus()
          .setTextSelection({ from: pos, to: pos + node.nodeSize })
          .deleteSelection()
          .run()
      } catch (fallbackError) {
        console.error('Error deleting heading:', fallbackError)
      }
    }
    return
  }
  
  // Replace the heading content and optionally change level
  const currentLevel = node.attrs?.level || 1
  const newLevel = level ? Math.min(Math.max(level, 1), 6) : currentLevel
  
  try {
    // Get the text content range - headings typically have text starting at pos+1
    // and ending before the closing tag at pos+nodeSize-1
    const textStart = pos + 1
    const textEnd = pos + node.nodeSize - 1
    
    // Select the text content inside the heading and replace it
    editor.chain()
      .focus()
      .setTextSelection({ from: textStart, to: textEnd })
      .deleteSelection()
      .insertContent(text)
      .run()
    
    // If level changed, update the heading level
    if (newLevel !== currentLevel) {
      // Re-find the heading position after content change
      const updatedHeadings: Array<{ pos: number; node: any }> = []
      editor.state.doc.descendants((currentNode: any, currentPos: number) => {
        if (currentNode.type && currentNode.type.name === 'heading') {
          updatedHeadings.push({ pos: currentPos, node: currentNode })
        }
        return true
      })
      
      if (headingIndex < updatedHeadings.length) {
        const updatedHeading = updatedHeadings[headingIndex]
        editor.chain()
          .focus()
          .setTextSelection({ from: updatedHeading.pos, to: updatedHeading.pos + updatedHeading.node.nodeSize })
          .setNode('heading', { level: newLevel })
          .run()
      }
    }
  } catch (error) {
    console.error('Error replacing heading:', error)
    // Fallback: replace the entire heading by deleting and inserting
    try {
      const headingContent = `<h${newLevel}>${text}</h${newLevel}>`
      editor.chain()
        .focus()
        .setTextSelection({ from: pos, to: pos + node.nodeSize })
        .deleteSelection()
        .insertContentAt(pos, headingContent)
        .run()
    } catch (fallbackError) {
      console.error('Error in fallback heading replacement:', fallbackError)
    }
  }
}

function insertListWithTiptap(editor: any, position: number, items: string[], listType: 'bulleted' | 'numbered') {
  // Create list HTML and insert it
  const listTag = listType === 'numbered' ? 'ol' : 'ul';
  const listItems = items.map(item => `<li>${item}</li>`).join('');
  const listContent = `<${listTag}>${listItems}</${listTag}>`;
  
  try {
    editor.chain().focus().insertContentAt(position, listContent).run();
  } catch (error) {
    // Fallback: insert at current position
    editor.chain().focus().insertContent(listContent).run();
  }
}

function insertTableWithTiptap(editor: any, position: number, rows: string[][], hasHeaders?: boolean) {
  // Create table HTML and insert it
  // Note: This assumes the editor has table support enabled
  let tableHTML = '<table>';
  
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    tableHTML += '<tr>';
    
    for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
      const cellContent = row[cellIndex];
      const cellTag = (hasHeaders && rowIndex === 0) ? 'th' : 'td';
      tableHTML += `<${cellTag}>${cellContent}</${cellTag}>`;
    }
    
    tableHTML += '</tr>';
  }
  
  tableHTML += '</table>';
  
  try {
    editor.chain().focus().insertContentAt(position, tableHTML).run();
  } catch (error) {
    // Fallback: insert at current position
    editor.chain().focus().insertContent(tableHTML).run();
  }
}

function formatTextWithTiptap(editor: any, startPosition: number, endPosition: number, formatting: any) {
  // Apply formatting to selected text range
  try {
    let chain = editor.chain().focus().setTextSelection({ from: startPosition, to: endPosition });
    
    if (formatting.bold) {
      chain = chain.toggleBold();
    }
    if (formatting.italic) {
      chain = chain.toggleItalic();
    }
    if (formatting.underline) {
      chain = chain.toggleUnderline();
    }
    
    chain.run();
  } catch (error) {
    console.error('Error formatting text with Tiptap:', error);
  }
}

function insertImageWithTiptap(editor: any, position: number, imageUrl: string, alt?: string, width?: number, height?: number) {
  // Insert image using Tiptap's image command
  const imageAttrs: any = { src: imageUrl };
  if (alt) imageAttrs.alt = alt;
  if (width) imageAttrs.width = width;
  if (height) imageAttrs.height = height;
  
  try {
    editor.chain().focus().insertContentAt(position, {
      type: 'image',
      attrs: imageAttrs
    }).run();
  } catch (error) {
    // Fallback: insert as HTML
    let imageHTML = `<img src="${imageUrl}"`;
    if (alt) imageHTML += ` alt="${alt}"`;
    if (width) imageHTML += ` width="${width}"`;
    if (height) imageHTML += ` height="${height}"`;
    imageHTML += ' />';
    
    editor.chain().focus().insertContent(imageHTML).run();
  }
}

/**
 * Apply operations to editor temporarily to get resulting HTML, then restore original content
 * This is used to generate HTML for diff preview without actually applying changes
 */
function applyOperationsToGetHtml(editor: any, originalHtml: string, operations: DocxOperation[]): string {
  // Store original content
  const originalContent = editor.getHTML();
  
  try {
    // Set the original HTML to ensure we start from the correct state
    editor.chain().setContent(originalHtml, { emitUpdate: false }).run();
    
    // Apply all operations
    applyTiptapOperations(editor, operations);
    
    // Get the resulting HTML
    const resultingHtml = editor.getHTML();
    
    // Restore original content
    editor.chain().setContent(originalContent, { emitUpdate: false }).run();
    
    return resultingHtml;
  } catch (error) {
    console.error('Error applying operations to get HTML:', error);
    // Restore original content on error
    try {
      editor.chain().setContent(originalContent, { emitUpdate: false }).run();
    } catch (restoreError) {
      console.error('Error restoring original content:', restoreError);
    }
    // Return original HTML as fallback
    return originalHtml;
  }
}

// Note: Tiptap automatically handles change events through its transaction system
// No need for manual event triggering when using proper Tiptap commands
