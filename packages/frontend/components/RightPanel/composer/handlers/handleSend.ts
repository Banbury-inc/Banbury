import { extractEmailContent } from "../../../../utils/emailUtils"
import type React from "react"

interface HandleSendParams {
  composer: any
  onSend?: () => void
  tabId?: string
  // Optional refs for direct element access (more robust than DOM queries)
  composerContainerRef?: React.RefObject<HTMLDivElement>
  proseMirrorRef?: React.RefObject<HTMLElement>
  inputRef?: React.RefObject<HTMLTextAreaElement>
}

export function handleSend({
  composer,
  onSend,
  tabId,
  composerContainerRef,
  proseMirrorRef,
  inputRef
}: HandleSendParams) {
  // Strategy 1: Try to use refs (most reliable)
  let input = inputRef?.current;
  let proseMirror = proseMirrorRef?.current;

  // Strategy 2: Fall back to scoped DOM queries if refs are not available
  if (!input || !proseMirror) {
    const scope = tabId
      ? document.querySelector(`[data-tab-id="${tabId}"]`)
      : document;

    if (!scope && tabId) {
      console.warn('[handleSend] Could not find tab scope, falling back to document', { tabId });
    }

    const queryScope = scope || document;

    if (!input) {
      input = queryScope.querySelector('textarea[aria-label="Message input"]') as HTMLTextAreaElement | null;
    }

    if (!proseMirror) {
      // Get the first ProseMirror element from scoped query
      const proseMirrorElements = queryScope.querySelectorAll('.ProseMirror');
      if (proseMirrorElements.length > 0) {
        proseMirror = proseMirrorElements[0] as HTMLElement;
      }
    }
  }

  // Prefer the hidden textarea value, which tiptap keeps in sync (preserves newlines)
  let text = input?.value ?? ''

  // Fallback: Get the text directly from the Tiptap editor DOM if the textarea is empty
  if (!text.trim() && proseMirror) {
    // Extract paragraphs to preserve line breaks when possible
    const paragraphs = Array.from(proseMirror.querySelectorAll('p'))
    if (paragraphs.length > 0) {
      text = paragraphs.map((p) => (p.textContent || '').trimEnd()).join('\n\n')
    } else {
      text = proseMirror.textContent || ''
    }
  }
  
  // CRITICAL: Set document context with email content BEFORE any composer.send() call
  try {
    // Get existing document content (docx, etc) - try to get current unsaved content from editor
    let documentContent = ''
    try {
      // First, try to get editor from the registered global reference (most reliable)
      if (typeof window !== 'undefined' && (window as any)._tiptapDocxEditors) {
        const editors = (window as any)._tiptapDocxEditors;
        // Return the most recently registered editor that's still active
        for (let i = editors.length - 1; i >= 0; i--) {
          const editor = editors[i];
          if (editor && typeof editor.getHTML === 'function' && !editor.isDestroyed) {
            const currentHtml = editor.getHTML();
            if (currentHtml && currentHtml.trim().length > 20) {
              // Convert HTML to plain text for context (preserving structure)
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = currentHtml;
              const textContent = tempDiv.textContent || tempDiv.innerText || '';
              if (textContent.trim().length > 20) {
                documentContent = textContent;
                break; // Found document content
              }
            }
          }
        }
      }
      
      // Fallback: Try to find editor through DOM
      if (!documentContent) {
        const documentEditors = Array.from(document.querySelectorAll('.ProseMirror[contenteditable="true"]'))
        for (const element of documentEditors) {
          // Skip if it's the current chat editor
          const isInChatComposer = element.closest('.bg-zinc-800') || element.closest('.min-h-16')
          if (isInChatComposer) continue
          
          // Check various document editor indicators
          const hasSimpleTiptapClass = element.classList.contains('simple-tiptap-editor') || 
                                       element.closest('.simple-tiptap-editor')
          const isInAITiptap = element.closest('.min-h-\\[600px\\]') || 
                              element.closest('.bg-card')
          const isInWordViewer = element.closest('[class*="MuiBox"]') || 
                                element.closest('.h-full.border-0.rounded-none')
          
          if (hasSimpleTiptapClass || isInAITiptap || isInWordViewer) {
            // Try to get HTML from editor instance if available
            let content = '';
            if ((element as any).__editor && typeof (element as any).__editor.getHTML === 'function') {
              const html = (element as any).__editor.getHTML();
              if (html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                content = tempDiv.textContent || tempDiv.innerText || '';
              }
            } else {
              // Fallback to textContent
              content = element.textContent || ''
            }
            
            if (content.trim() && content.length > 20) {
              documentContent = content;
              break; // Found document content
            }
          }
        }
      }
    } catch {}
    
    // Get and merge email content
    const emailsRaw = localStorage.getItem('pendingEmailAttachments')
    const emails = emailsRaw ? JSON.parse(emailsRaw) : []
    const emailSections: string[] = []
    if (Array.isArray(emails)) {
      emails.forEach((e: any) => {
        const subject = e?.subject || 'No Subject'
        const from = e?.from || ''
        const dateStr = e?.date || ''
        let body = ''
        try {
          if (e?.payload) {
            const content = extractEmailContent(e.payload)
            const raw = (content?.text || content?.html || e?.snippet || '').toString()
            body = raw.length > 20000 ? raw.slice(0, 20000) + '\n...[truncated]...' : raw
          } else {
            const raw = (e?.preview || e?.snippet || '').toString()
            body = raw.length > 20000 ? raw.slice(0, 20000) + '\n...[truncated]...' : raw
          }
        } catch {}
        emailSections.push([
          `Subject: ${subject}`,
          from ? `From: ${from}` : '',
          dateStr ? `Date: ${dateStr}` : '',
          'Body:',
          body
        ].filter(Boolean).join('\n'))
      })
    }

    const emailDocBlock = emailSections.length > 0
      ? ['Current email content:', ...emailSections].join('\n\n---\n\n')
      : ''

    const combinedContext = [documentContent, emailDocBlock].filter(Boolean).join('\n\n')
    if (combinedContext) {
      localStorage.setItem('pendingDocumentContext', combinedContext)
    } else {
      localStorage.removeItem('pendingDocumentContext')
    }
  } catch (error) {
    console.error('[Composer.tsx] DEBUG - Error in email merge:', error)
  }
    
  if (text.trim().length > 0) {
    // Reuse the input element we already found (either from ref or scoped query)
    if (input) {
      // Set the input value and trigger all possible events
      input.value = text // Keep only the user's message visible
      input.focus()
      
      // Trigger all possible events to ensure detection
      const eventTypes: string[] = ['input', 'change', 'keyup', 'keydown', 'focus', 'blur']
      eventTypes.forEach((eventType) => {
        input.dispatchEvent(new Event(eventType, { bubbles: true }))
      })
      
      // Use the composer's setText method with just the chat text (hidden context is provided separately)
      try {
        if (composer && typeof composer.setText === 'function') {
          composer.setText(text)
        }
      } catch (e) {
        console.error('Error setting composer text:', e)
      }
      
      // Wait and then send
      setTimeout(() => {
        composer.send()
        
        // Dispatch event to update tab title from first user message
        try {
          const activeTabId = tabId || (window as any).__banburyActiveAiTabId
          if (activeTabId && text.trim()) {
            window.dispatchEvent(new CustomEvent('assistant-ai-tab-title-candidate', {
              detail: { tabId: activeTabId, text: text.trim() }
            }))
          }
        } catch {}
        
        // Call the onSend callback if provided
        if (onSend) {
          onSend()
        }
        
        // Clear after sending using proper event
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('composer-clear'))
        }, 100)
      }, 50) // Reduced delay since context is already set
    }
  }
}

