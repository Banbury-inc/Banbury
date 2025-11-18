import type { ChartDefinition, ChartData, ChartDataRange } from '../types/chart-types'

interface ChartHandlersParams {
  setCharts: React.Dispatch<React.SetStateAction<ChartDefinition[]>>
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
}

export function createChartHandlers({ setCharts, setHasChanges }: ChartHandlersParams) {
  const addChart = (chart: ChartDefinition) => {
    setCharts((prev) => [...prev, chart])
    setHasChanges(true)
  }

  const updateChart = (chartId: string, updates: Partial<ChartDefinition>) => {
    setCharts((prev) =>
      prev.map((chart) =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    )
    setHasChanges(true)
  }

  const deleteChart = (chartId: string) => {
    setCharts((prev) => prev.filter((chart) => chart.id !== chartId))
    setHasChanges(true)
  }

  const moveChart = (chartId: string, x: number, y: number) => {
    setCharts((prev) =>
      prev.map((chart) =>
        chart.id === chartId ? { ...chart, position: { x, y } } : chart
      )
    )
    setHasChanges(true)
  }

  const resizeChart = (chartId: string, width: number, height: number) => {
    setCharts((prev) =>
      prev.map((chart) =>
        chart.id === chartId ? { ...chart, size: { width, height } } : chart
      )
    )
    setHasChanges(true)
  }

  return {
    addChart,
    updateChart,
    deleteChart,
    moveChart,
    resizeChart
  }
}

export function extractChartData(
  data: any[][],
  chart: ChartDefinition
): ChartData {
  const { dataRange, options } = chart
  const categoryCol = options.categoryColumn ?? 0

  const categories: string[] = []
  const seriesData: { [key: string]: number[] } = {}
  const seriesNames: string[] = []

  // Extract data from the specified range
  for (let row = dataRange.startRow; row <= dataRange.endRow; row++) {
    if (!data[row]) continue

    // First row might contain headers
    if (row === dataRange.startRow) {
      for (let col = dataRange.startCol; col <= dataRange.endCol; col++) {
        if (col === categoryCol + dataRange.startCol) continue
        const header = data[row][col]
        const seriesName = header ? String(header) : `Series ${col - dataRange.startCol + 1}`
        seriesNames.push(seriesName)
        seriesData[seriesName] = []
      }
      continue
    }

    // Extract category (x-axis label)
    const categoryValue = data[row][categoryCol + dataRange.startCol]
    categories.push(categoryValue ? String(categoryValue) : `Row ${row + 1}`)

    // Extract series values
    let seriesIndex = 0
    for (let col = dataRange.startCol; col <= dataRange.endCol; col++) {
      if (col === categoryCol + dataRange.startCol) continue
      
      const seriesName = seriesNames[seriesIndex]
      const value = data[row][col]
      const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
      seriesData[seriesName].push(numericValue)
      seriesIndex++
    }
  }

  // Convert to ChartData format
  const series = seriesNames.map((name) => ({
    name,
    data: seriesData[name] || []
  }))

  return {
    categories,
    series
  }
}

export function parseA1Range(a1: string): ChartDataRange | null {
  try {
    const match = a1.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i)
    if (!match) return null
    
    const letterToColumn = (letter: string): number => {
      let col = 0
      for (let i = 0; i < letter.length; i++) {
        col = col * 26 + (letter.charCodeAt(i) - 64)
      }
      return col - 1
    }

    return {
      startCol: letterToColumn(match[1].toUpperCase()),
      startRow: parseInt(match[2], 10) - 1,
      endCol: letterToColumn(match[3].toUpperCase()),
      endRow: parseInt(match[4], 10) - 1
    }
  } catch {
    return null
  }
}

export function rangeToA1(range: ChartDataRange): string {
  const columnToLetter = (col: number): string => {
    let letter = ''
    let temp = col + 1
    while (temp > 0) {
      const remainder = (temp - 1) % 26
      letter = String.fromCharCode(65 + remainder) + letter
      temp = Math.floor((temp - 1) / 26)
    }
    return letter
  }

  return `${columnToLetter(range.startCol)}${range.startRow + 1}:${columnToLetter(range.endCol)}${range.endRow + 1}`
}

