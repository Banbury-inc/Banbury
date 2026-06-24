interface SelectionFontSizeParams {
  cellStyles: { [key: string]: React.CSSProperties }
  fallbackFontSize: number
  selection: [number, number, number, number]
}

function parseFontSize(fontSize: React.CSSProperties['fontSize']) {
  if (typeof fontSize === 'number') return fontSize
  if (typeof fontSize !== 'string') return null

  const parsedFontSize = parseInt(fontSize, 10)
  if (Number.isNaN(parsedFontSize)) return null

  return parsedFontSize
}

function getSelectionFontSize({
  cellStyles,
  fallbackFontSize,
  selection
}: SelectionFontSizeParams) {
  const [selectedRow, selectedCol] = selection
  const cellKey = `${selectedRow}-${selectedCol}`
  const selectedFontSize = parseFontSize(cellStyles[cellKey]?.fontSize)

  return selectedFontSize ?? fallbackFontSize
}

export { getSelectionFontSize }
export type { SelectionFontSizeParams }
