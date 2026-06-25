import React, { useState } from 'react'
import { Button } from '../../../common/ui/button'
import { Input } from '../../../common/ui/old-input'
import { Label } from '../../../common/ui/label'
import type { ChartDefinition, ChartType, ChartDataRange } from '../types/chart-types'

interface ChartEditorProps {
  chart?: ChartDefinition
  onSave: (chart: ChartDefinition) => void
  onCancel: () => void
  maxRows: number
  maxCols: number
}

function columnToLetter(col: number): string {
  let letter = ''
  let temp = col + 1
  while (temp > 0) {
    const remainder = (temp - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    temp = Math.floor((temp - 1) / 26)
  }
  return letter
}

function letterToColumn(letter: string): number {
  let col = 0
  for (let i = 0; i < letter.length; i++) {
    col = col * 26 + (letter.charCodeAt(i) - 64)
  }
  return col - 1
}

function rangeToA1(range: ChartDataRange): string {
  return `${columnToLetter(range.startCol)}${range.startRow + 1}:${columnToLetter(range.endCol)}${range.endRow + 1}`
}

function a1ToRange(a1: string): ChartDataRange | null {
  try {
    const match = a1.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i)
    if (!match) return null
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

export const ChartEditor: React.FC<ChartEditorProps> = ({
  chart,
  onSave,
  onCancel,
  maxRows,
  maxCols
}) => {
  const [chartType, setChartType] = useState<ChartType>(chart?.type || 'bar')
  const [chartName, setChartName] = useState(chart?.name || 'New Chart')
  const [title, setTitle] = useState(chart?.options.title || '')
  const [dataRangeA1, setDataRangeA1] = useState(
    chart ? rangeToA1(chart.dataRange) : 'A1:B10'
  )
  const [categoryColumn, setCategoryColumn] = useState(
    chart?.options.categoryColumn !== undefined ? chart.options.categoryColumn : 0
  )
  const [xAxisLabel, setXAxisLabel] = useState(chart?.options.xAxisLabel || '')
  const [yAxisLabel, setYAxisLabel] = useState(chart?.options.yAxisLabel || '')
  const [showLegend, setShowLegend] = useState(chart?.options.showLegend ?? true)
  const [showGrid, setShowGrid] = useState(chart?.options.showGrid ?? true)
  const [error, setError] = useState<string>('')

  const handleSave = () => {
    // Validate data range
    const dataRange = a1ToRange(dataRangeA1)
    if (!dataRange) {
      setError('Invalid data range. Use format like A1:B10')
      return
    }

    if (
      dataRange.startRow < 0 ||
      dataRange.startCol < 0 ||
      dataRange.endRow >= maxRows ||
      dataRange.endCol >= maxCols
    ) {
      setError(`Data range must be within the spreadsheet bounds`)
      return
    }

    if (
      dataRange.startRow > dataRange.endRow ||
      dataRange.startCol > dataRange.endCol
    ) {
      setError('Invalid range: start must be before end')
      return
    }

    // Create or update chart
    const updatedChart: ChartDefinition = {
      id: chart?.id || `chart-${Date.now()}`,
      name: chartName,
      type: chartType,
      position: chart?.position || { x: 100, y: 100 },
      size: chart?.size || { width: 500, height: 350 },
      dataRange,
      series: [],
      options: {
        title,
        xAxisLabel,
        yAxisLabel,
        showLegend,
        showGrid,
        categoryColumn
      }
    }

    onSave(updatedChart)
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="w-[90%] max-h-[90vh] max-w-xl overflow-y-auto rounded-lg bg-background p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          {chart ? 'Edit Chart' : 'Create Chart'}
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Chart Name */}
          <div>
            <Label htmlFor="chart-name" className="text-foreground">
              Chart Name
            </Label>
            <Input
              id="chart-name"
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              placeholder="My Chart"
              className="text-foreground"
            />
          </div>

          {/* Chart Type */}
          <div>
            <Label htmlFor="chart-type" className="text-foreground">
              Chart Type
            </Label>
            <select
              id="chart-type"
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-foreground"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="scatter">Scatter Plot</option>
              <option value="composed">Composed Chart</option>
            </select>
          </div>

          {/* Data Range */}
          <div>
            <Label htmlFor="data-range" className="text-foreground">
              Data Range
            </Label>
            <Input
              id="data-range"
              value={dataRangeA1}
              onChange={(e) => {
                setDataRangeA1(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder="A1:B10"
              className="text-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Format: A1:D10 (columns and rows)
            </p>
          </div>

          {/* Category Column */}
          {chartType !== 'pie' && (
            <div>
              <Label htmlFor="category-column" className="text-foreground">
                Category Column (X-axis)
              </Label>
              <Input
                id="category-column"
                type="number"
                value={categoryColumn}
                onChange={(e) => setCategoryColumn(parseInt(e.target.value, 10) || 0)}
                min={0}
                max={maxCols - 1}
                className="text-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Column index for labels (0 = first column)
              </p>
            </div>
          )}

          {/* Chart Title */}
          <div>
            <Label htmlFor="chart-title" className="text-foreground">
              Chart Title
            </Label>
            <Input
              id="chart-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sales Data"
              className="text-foreground"
            />
          </div>

          {/* Axis Labels */}
          {chartType !== 'pie' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="x-axis-label" className="text-foreground">
                  X-Axis Label
                </Label>
                <Input
                  id="x-axis-label"
                  value={xAxisLabel}
                  onChange={(e) => setXAxisLabel(e.target.value)}
                  placeholder="Month"
                  className="text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="y-axis-label" className="text-foreground">
                  Y-Axis Label
                </Label>
                <Input
                  id="y-axis-label"
                  value={yAxisLabel}
                  onChange={(e) => setYAxisLabel(e.target.value)}
                  placeholder="Revenue"
                  className="text-foreground"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
              />
              <span className="text-sm text-foreground">Show Legend</span>
            </label>

            {chartType !== 'pie' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                <span className="text-sm text-foreground">Show Grid</span>
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {chart ? 'Update Chart' : 'Create Chart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

