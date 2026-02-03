import type { RefObject, MutableRefObject, Dispatch, SetStateAction } from "react"

export interface VisibleButtons {
  model: boolean
  plus: boolean
  mic: boolean
  modeText: boolean
}

interface CheckButtonVisibilityParams {
  containerRef: RefObject<HTMLDivElement>
  buttonsRef: RefObject<HTMLDivElement>
  setVisibleButtons: Dispatch<SetStateAction<VisibleButtons>>
  setIsMeasuring: Dispatch<SetStateAction<boolean>>
  isMeasuringRef: MutableRefObject<boolean>
  previousWidthRef: MutableRefObject<number>
}

export function checkButtonVisibility({
  containerRef,
  buttonsRef,
  setVisibleButtons,
  setIsMeasuring,
  isMeasuringRef,
  previousWidthRef,
}: CheckButtonVisibilityParams) {
  const container = containerRef.current
  const buttonsContainer = buttonsRef.current
  if (!container || !buttonsContainer) return

  const containerWidth = container.offsetWidth
  if (containerWidth === 0) return // Container not ready yet
  
  const sendButtonWidth = 36 // h-7 w-7 = 28px + padding
  const padding = 16 // p-2 = 8px on each side
  const gap = 8 // gap-2 = 8px
  
  // Reserve space for send button and padding
  const availableWidth = containerWidth - sendButtonWidth - padding * 2
  if (availableWidth <= 0) {
    // Not enough space for any buttons, hide all
    setVisibleButtons({
      model: false,
      plus: false,
      mic: false,
      modeText: false,
    })
    setIsMeasuring(false)
    isMeasuringRef.current = false
    previousWidthRef.current = containerWidth
    return
  }
  
  // Function to measure buttons and determine visibility
  const measureButtons = () => {
    // Get all button elements in priority order (most important first)
    const buttonElements = Array.from(buttonsContainer.children) as HTMLElement[]
    if (buttonElements.length === 0) {
      // If no buttons are rendered yet and we're measuring, retry
      if (isMeasuringRef.current) {
        setTimeout(measureButtons, 50)
      }
      return
    }

    let totalWidth = 0
    const buttonKeys: Array<keyof VisibleButtons> = ['model', 'plus', 'mic']
    const newVisibility: VisibleButtons = {
      model: false,
      plus: false,
      mic: false,
      modeText: false,
    }

    // Calculate which buttons fit, starting with highest priority
    for (let i = 0; i < buttonElements.length && i < buttonKeys.length; i++) {
      const button = buttonElements[i]
      const buttonWidth = button.offsetWidth + gap
      const key = buttonKeys[i]
      
      if (key && totalWidth + buttonWidth <= availableWidth) {
        totalWidth += buttonWidth
        newVisibility[key] = true
      } else {
        // Stop checking remaining buttons
        break
      }
    }

    // Set modeText to true only if all other buttons are visible (no overflow)
    newVisibility.modeText = newVisibility.model && newVisibility.plus && newVisibility.mic

    setVisibleButtons(newVisibility)
    setIsMeasuring(false)
    isMeasuringRef.current = false
    previousWidthRef.current = containerWidth
  }
  
  // If container got wider, temporarily enable measuring to show all buttons for measurement
  const containerGotWider = containerWidth > previousWidthRef.current && previousWidthRef.current > 0
  if (containerGotWider) {
    setIsMeasuring(true)
    isMeasuringRef.current = true
    // Wait for DOM to update before measuring
    setTimeout(measureButtons, 50)
    return
  }
  
  // Otherwise measure immediately
  measureButtons()
}
