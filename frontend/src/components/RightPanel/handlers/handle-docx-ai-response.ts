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
    showErrorFeedback('No active document editor found. Please make sure you have a document open.');
    return;
  }
  
  
  try {
    if (payload.htmlContent && payload.htmlContent.trim().length > 0) {
      if (payload.preview) {
        // Store original content if this is the first preview
        if (!isPreviewActive) {
          originalContent = editorInstance.getHTML();
        }
        
        // Show diff preview
        const currentContent = originalContent || editorInstance.getHTML();
        const diffHtml = createStructuredHtmlDiff(currentContent, payload.htmlContent);
        
        // Mark that we're in preview mode (this prevents saving via isShowingPreview())
        isPreviewActive = true;
        
        // Set the diff content in the editor
        editorInstance.chain().focus().setContent(diffHtml).run();
        
        showPreviewFeedback('Preview shown - Review changes before accepting');
      } else {
        // Prevent double application - check if this content was already applied
        if (lastAppliedContent === payload.htmlContent) {
          console.log('Content already applied, skipping duplicate application');
          return;
        }
        
        // Apply changes directly
        // If we have original content stored, we're coming from a preview
        // In that case, restore original first, then apply the new content
        if (isPreviewActive && originalContent) {
          // Restore original content silently
          editorInstance.chain().focus().setContent(originalContent, { emitUpdate: false }).run();
        }
        
        // Now apply the new content
        applyHtmlContentToTiptap(editorInstance, payload.htmlContent);
        
        // Clear preview state
        originalContent = null;
        isPreviewActive = false;
        lastAppliedContent = payload.htmlContent;
        
        showSuccessFeedback('Changes applied successfully');
        
        // Clear the last applied content after a delay to allow future applications
        setTimeout(() => {
          if (lastAppliedContent === payload.htmlContent) {
            lastAppliedContent = null;
          }
        }, 1000);
      }
    } else if (payload.operations && payload.operations.length > 0) {
      // Apply individual operations using Tiptap commands
      applyTiptapOperations(editorInstance, payload.operations);
      originalContent = null;
      isPreviewActive = false;
      showSuccessFeedback('Operations applied successfully');
    } else {
      console.warn('No valid content or operations provided in payload');
      showErrorFeedback('No document changes to apply');
      return;
    }
  } catch (error) {
    console.error('Error applying DOCX operations:', error);
    showErrorFeedback('Failed to apply document changes');
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
      showInfoFeedback('Changes rejected - Document restored');
    }
  });
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

function applyHtmlContentToTiptap(editor: any, htmlContent: string) {
  // Use Tiptap's setContent command to replace entire content
  // Reference: https://tiptap.dev/docs/editor/api/commands/content
  
  try {
    const result = editor.chain().focus().setContent(htmlContent).run();
  } catch (error) {
    console.error('Error setting Tiptap content:', error);
    // Fallback to clearContent and insertContent
    try {
      editor.chain().focus().clearContent().insertContent(htmlContent).run();
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
  // For now, just insert a new heading
  const headingLevel = level ? Math.min(Math.max(level, 1), 6) : 1;
  const headingContent = `<h${headingLevel}>${text}</h${headingLevel}>`;
  editor.chain().focus().insertContent(headingContent).run();
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

// Note: Tiptap automatically handles change events through its transaction system
// No need for manual event triggering when using proper Tiptap commands

function showSuccessFeedback(action: string) {
  // Create a temporary success message
  const feedback = document.createElement('div');
  feedback.textContent = `✓ ${action} applied successfully`;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 3000);
}

function showErrorFeedback(message: string) {
  const feedback = document.createElement('div');
  feedback.textContent = `✗ ${message}`;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 3000);
}

function showPreviewFeedback(message: string) {
  const feedback = document.createElement('div');
  feedback.textContent = `👁️ ${message}`;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f59e0b;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 5000);
}

function showInfoFeedback(message: string) {
  const feedback = document.createElement('div');
  feedback.textContent = `ℹ️ ${message}`;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #3b82f6;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 3000);
}
