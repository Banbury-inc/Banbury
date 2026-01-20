interface ToolbarButton {
  id: string
  isDivider?: boolean
  isCustom?: boolean
  customType?: 'dimensions' | 'font-size' | 'font-family'
}

interface CalculateVisibleButtonsParams {
  containerWidth: number
  allButtons: ToolbarButton[]
  reserved: number
  overflowButtonWidth: number
  buttonWidth: number
  dividerWidth: number
}

export function calculateVisibleButtons({
  containerWidth,
  allButtons,
  reserved,
  overflowButtonWidth,
  buttonWidth,
  dividerWidth,
}: CalculateVisibleButtonsParams): string[] {
  if (containerWidth === 0) {
    return allButtons.filter(b => !b.isDivider).map(b => b.id)
  }
  
  const available = Math.max(0, containerWidth - reserved - overflowButtonWidth)
  let used = 0
  const visible: string[] = []
  
  for (const btn of allButtons) {
    if (btn.isDivider) {
      used += dividerWidth
      continue
    }
    const width = btn.isCustom ? (btn.customType === 'dimensions' ? 140 : 100) : buttonWidth
    if (used + width <= available) {
      visible.push(btn.id)
      used += width
    } else {
      break
    }
  }
  
  if (visible.length === 0) {
    return allButtons.slice(0, 5).filter(b => !b.isDivider).map(b => b.id)
  }
  
  return visible
}
