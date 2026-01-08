interface HandleComposerSendEventParams {
  composer: any
  assistantTabId?: string
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  onSend?: () => void
  sendButtonRef?: React.RefObject<HTMLButtonElement | null>
}

/**
 * Creates a listener for the `assistant-composer-send` event.
 * This allows programmatic sending of messages through the composer,
 * appearing exactly as if the user typed and pressed Send.
 */
export function createComposerSendEventListener({
  composer,
  assistantTabId,
  inputRef,
  onSend,
  sendButtonRef,
}: HandleComposerSendEventParams) {
  const handleComposerSendEvent = (event: CustomEvent) => {
    const { tabId, text } = event.detail || {}
    
    // Only handle if this is the target tab
    if (tabId && assistantTabId && tabId !== assistantTabId) {
      return
    }
    
    if (!text || typeof text !== "string") {
      return
    }

    // Use composer directly to send the message
    // This is more reliable than DOM manipulation
    if (composer && typeof composer.setText === 'function' && typeof composer.send === 'function') {
      try {
        composer.setText(text)
        setTimeout(() => {
          composer.send()
          if (onSend) onSend()
        }, 100)
      } catch (err) {
        console.error('[handleComposerSendEvent] Error using composer:', err)
      }
    } else {
      // Fallback: Write text to the hidden textarea and trigger events
      const input = inputRef.current
      if (input) {
        input.value = text
        input.focus()
        
        // Trigger events to sync with the composer
        const eventTypes = ["input", "change", "keyup", "keydown", "focus"]
        eventTypes.forEach((eventType) => {
          input.dispatchEvent(new Event(eventType, { bubbles: true }))
        })

        // Also dispatch composer-set-text event for the tiptap editor
        try {
          window.dispatchEvent(new CustomEvent("composer-set-text", { detail: { text } }))
        } catch {}

        // Manually trigger the send after a delay
        setTimeout(() => {
          // Strategy 1: Try to use ref (most reliable)
          let sendButton = sendButtonRef?.current;

          // Strategy 2: Fall back to scoped query if ref not available
          if (!sendButton) {
            const scope = assistantTabId
              ? document.querySelector(`[data-tab-id="${assistantTabId}"]`)
              : document;

            const queryScope = scope || document;
            sendButton = queryScope.querySelector('[aria-label="Send message"]') as HTMLButtonElement;
          }

          if (sendButton && !sendButton.disabled) {
            sendButton.click()
            if (onSend) onSend()
          } else {
            console.warn('[handleComposerSendEvent] Could not find/click send button', { assistantTabId, hasRef: !!sendButtonRef?.current })
          }
        }, 200)
      } else {
        console.error('[handleComposerSendEvent] No input ref available')
      }
    }
  }

  return handleComposerSendEvent as EventListener
}
