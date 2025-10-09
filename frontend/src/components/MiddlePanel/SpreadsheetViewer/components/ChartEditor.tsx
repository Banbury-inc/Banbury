import React, { useState, useEffect } from 'react'
import { Button } from '../../../ui/button'
import { Input } from '../../../ui/old-input'
import { Label } from '../../../ui/label'
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 8,
          padding: 24,
          width: '90%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
          {chart ? 'Edit Chart' : 'Create Chart'}
        </h2>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 14
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Chart Name */}
          <div>
            <Label htmlFor="chart-name" style={{ color: '#111827' }}>
              Chart Name
            </Label>
            <Input
              id="chart-name"
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              placeholder="My Chart"
              style={{ color: '#111827' }}
            />
          </div>

          {/* Chart Type */}
          <div>
            <Label htmlFor="chart-type" style={{ color: '#111827' }}>
              Chart Type
            </Label>
            <select
              id="chart-type"
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="border rounded-md h-9 px-2 bg-white text-black w-full"
              style={{ color: '#111827' }}
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
            <Label htmlFor="data-range" style={{ color: '#111827' }}>
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
              style={{ color: '#111827' }}
            />
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              Format: A1:D10 (columns and rows)
            </p>
          </div>

          {/* Category Column */}
          {chartType !== 'pie' && (
            <div>
              <Label htmlFor="category-column" style={{ color: '#111827' }}>
                Category Column (X-axis)
              </Label>
              <Input
                id="category-column"
                type="number"
                value={categoryColumn}
                onChange={(e) => setCategoryColumn(parseInt(e.target.value, 10) || 0)}
                min={0}
                max={maxCols - 1}
                style={{ color: '#111827' }}
              />
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Column index for labels (0 = first column)
              </p>
            </div>
          )}

          {/* Chart Title */}
          <div>
            <Label htmlFor="chart-title" style={{ color: '#111827' }}>
              Chart Title
            </Label>
            <Input
              id="chart-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sales Data"
              style={{ color: '#111827' }}
            />
          </div>

          {/* Axis Labels */}
          {chartType !== 'pie' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label htmlFor="x-axis-label" style={{ color: '#111827' }}>
                  X-Axis Label
                </Label>
                <Input
                  id="x-axis-label"
                  value={xAxisLabel}
                  onChange={(e) => setXAxisLabel(e.target.value)}
                  placeholder="Month"
                  style={{ color: '#111827' }}
                />
              </div>
              <div>
                <Label htmlFor="y-axis-label" style={{ color: '#111827' }}>
                  Y-Axis Label
                </Label>
                <Input
                  id="y-axis-label"
                  value={yAxisLabel}
                  onChange={(e) => setYAxisLabel(e.target.value)}
                  placeholder="Revenue"
                  style={{ color: '#111827' }}
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
              />
              <span style={{ color: '#111827', fontSize: 14 }}>Show Legend</span>
            </label>

            {chartType !== 'pie' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                <span style={{ color: '#111827', fontSize: 14 }}>Show Grid</span>
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button
              onClick={onCancel}
              style={{
                backgroundColor: '#ffffff',
                color: '#111827',
                border: '1px solid #d1d5db'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff'
              }}
            >
              {chart ? 'Update Chart' : 'Create Chart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

