export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'composed'

export interface ChartDataRange {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
}

export interface ChartSeries {
  id: string
  name: string
  dataRange: ChartDataRange
  color?: string
}

export interface ChartDefinition {
  id: string
  name: string
  type: ChartType
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  dataRange: ChartDataRange
  series: ChartSeries[]
  options: {
    title?: string
    xAxisLabel?: string
    yAxisLabel?: string
    showLegend?: boolean
    showGrid?: boolean
    categoryColumn?: number // Column index for x-axis labels (0-based)
  }
}

export interface ChartData {
  categories: string[]
  series: {
    name: string
    data: number[]
    color?: string
  }[]
}

