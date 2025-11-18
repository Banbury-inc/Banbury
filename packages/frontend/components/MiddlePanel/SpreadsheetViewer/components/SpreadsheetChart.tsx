import React, { useState, useRef, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from 'recharts'
import type { ChartDefinition, ChartData } from '../types/chart-types'
import { Button } from '../../../ui/button'
import { X as CloseIcon, Edit2 as EditIcon, Move as MoveIcon, Maximize2 as ResizeIcon } from 'lucide-react'

interface SpreadsheetChartProps {
  chart: ChartDefinition
  data: ChartData
  onEdit: (chart: ChartDefinition) => void
  onDelete: (chartId: string) => void
  onMove: (chartId: string, x: number, y: number) => void
  onResize: (chartId: string, width: number, height: number) => void
}

export const SpreadsheetChart: React.FC<SpreadsheetChartProps> = ({
  chart,
  data,
  onEdit,
  onDelete,
  onMove,
  onResize
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const chartRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chart-header-drag')) {
      e.preventDefault()
      setIsDragging(true)
      const rect = chartRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const container = chartRef.current?.parentElement
        if (container) {
          const containerRect = container.getBoundingClientRect()
          const newX = e.clientX - containerRect.left - dragOffset.x
          const newY = e.clientY - containerRect.top - dragOffset.y
          onMove(chart.id, Math.max(0, newX), Math.max(0, newY))
        }
      } else if (isResizing) {
        const container = chartRef.current?.parentElement
        if (container && chartRef.current) {
          const containerRect = container.getBoundingClientRect()
          const chartRect = chartRef.current.getBoundingClientRect()
          const newWidth = e.clientX - chartRect.left
          const newHeight = e.clientY - chartRect.top
          onResize(
            chart.id,
            Math.max(200, newWidth),
            Math.max(150, newHeight)
          )
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, chart.id, dragOffset, onMove, onResize])

  const renderChart = () => {
    const commonProps = {
      data: data.categories.map((category, index) => {
        const point: any = { name: category }
        data.series.forEach((series) => {
          point[series.name] = series.data[index] || 0
        })
        return point
      }),
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    }

    const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

    switch (chart.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {chart.options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={{ value: chart.options.xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: chart.options.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            {chart.options.showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Line
                key={series.name}
                type="monotone"
                dataKey={series.name}
                stroke={series.color || COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {chart.options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={{ value: chart.options.xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: chart.options.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            {chart.options.showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Bar
                key={series.name}
                dataKey={series.name}
                fill={series.color || COLORS[index % COLORS.length]}
              />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {chart.options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={{ value: chart.options.xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: chart.options.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            {chart.options.showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Area
                key={series.name}
                type="monotone"
                dataKey={series.name}
                fill={series.color || COLORS[index % COLORS.length]}
                stroke={series.color || COLORS[index % COLORS.length]}
              />
            ))}
          </AreaChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data.categories.map((category, index) => ({
                name: category,
                value: data.series[0]?.data[index] || 0
              }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.categories.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            {chart.options.showLegend && <Legend />}
          </PieChart>
        )

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {chart.options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={{ value: chart.options.xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: chart.options.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            {chart.options.showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Scatter
                key={series.name}
                name={series.name}
                dataKey={series.name}
                fill={series.color || COLORS[index % COLORS.length]}
              />
            ))}
          </ScatterChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {chart.options.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={{ value: chart.options.xAxisLabel, position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: chart.options.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            {chart.options.showLegend && <Legend />}
            {data.series.map((series, index) => {
              if (index % 2 === 0) {
                return (
                  <Bar
                    key={series.name}
                    dataKey={series.name}
                    fill={series.color || COLORS[index % COLORS.length]}
                  />
                )
              }
              return (
                <Line
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={series.color || COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              )
            })}
          </ComposedChart>
        )

      default:
        return null
    }
  }

  return (
    <div
      ref={chartRef}
      style={{
        position: 'absolute',
        left: chart.position.x,
        top: chart.position.y,
        width: chart.size.width,
        height: chart.size.height,
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Chart Header */}
      <div
        className="chart-header-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          cursor: 'grab'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MoveIcon size={14} style={{ color: '#6b7280' }} />
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>
            {chart.options.title || chart.name}
          </h4>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            size="sm"
            style={{
              padding: '4px 8px',
              height: 'auto',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: 'none'
            }}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(chart)
            }}
          >
            <EditIcon size={14} />
          </Button>
          <Button
            size="sm"
            style={{
              padding: '4px 8px',
              height: 'auto',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: 'none'
            }}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(chart.id)
            }}
          >
            <CloseIcon size={14} />
          </Button>
        </div>
      </div>

      {/* Chart Content */}
      <div style={{ flex: 1, padding: 16, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Resize Handle */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 16,
          height: 16,
          cursor: 'nwse-resize',
          backgroundColor: '#3b82f6',
          borderBottomRightRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseDown={handleResizeMouseDown}
      >
        <ResizeIcon size={10} style={{ color: '#ffffff' }} />
      </div>
    </div>
  )
}

