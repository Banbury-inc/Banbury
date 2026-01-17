import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getOrCreatePresentation } from './utils'
import { percentToInches, formatColor } from '../pptxUtils'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'

export const addChartTool = tool(
  async (input: {
    presentationId?: string
    presentationName?: string
    fileId?: string
    slideIndex?: number
    x: number
    y: number
    width: number
    height: number
    chartType: 'bar' | 'line' | 'pie' | 'scatter'
    data: Array<{
      name: string
      labels?: string[]
      values: number[]
    }>
    title?: string
    showTitle?: boolean
    showLegend?: boolean
    legendPos?: 'b' | 't' | 'l' | 'r'
    catAxisTitle?: string
    showCatAxisTitle?: boolean
    valAxisTitle?: string
    showValAxisTitle?: boolean
    barDir?: 'bar' | 'col'
    lineSize?: number
    lineSmooth?: boolean
    showPercent?: boolean
    chartColors?: string[]
    valAxisMinVal?: number
    valAxisMaxVal?: number
    valAxisMajorUnit?: number
    catAxisLabelRotate?: number
    dataLabelPosition?: 'outEnd' | 'inEnd' | 'center' | 'bestFit'
    dataLabelColor?: string
  }, context: any) => {
    try {
      const sendEvent = getServerContextValue<Function>("sendEvent")
      const token = getServerContextValue<string>("authToken")

      if (!token) {
        throw new Error("Missing auth token in server context")
      }

      const presentationName = input.presentationName || 'Presentation'
      const { pptx, slides, id } = getOrCreatePresentation(input.presentationId, presentationName, input.fileId)

      // Determine target slide
      let targetSlide: any
      if (input.slideIndex !== undefined && slides[input.slideIndex]) {
        targetSlide = slides[input.slideIndex]
      } else if (slides.length > 0) {
        targetSlide = slides[slides.length - 1]
      } else {
        targetSlide = pptx.addSlide()
        slides.push(targetSlide)
      }

      // Map chart type to PptxGenJS chart constant
      const chartTypeMap: Record<string, any> = {
        'bar': pptx.charts.BAR,
        'line': pptx.charts.LINE,
        'pie': pptx.charts.PIE,
        'scatter': pptx.charts.SCATTER
      }

      const pptxChartType = chartTypeMap[input.chartType]
      if (!pptxChartType) {
        throw new Error(`Unsupported chart type: ${input.chartType}`)
      }

      // Prepare chart data
      const chartData = input.data.map(series => ({
        name: series.name,
        labels: series.labels || [],
        values: series.values
      }))

      // Build chart options
      const chartOptions: any = {
        x: percentToInches(input.x, 'width'),
        y: percentToInches(input.y, 'height'),
        w: percentToInches(input.width, 'width'),
        h: percentToInches(input.height, 'height'),
      }

      if (input.title !== undefined) chartOptions.title = input.title
      if (input.showTitle !== undefined) chartOptions.showTitle = input.showTitle
      if (input.showLegend !== undefined) chartOptions.showLegend = input.showLegend
      if (input.legendPos !== undefined) chartOptions.legendPos = input.legendPos
      if (input.catAxisTitle !== undefined) chartOptions.catAxisTitle = input.catAxisTitle
      if (input.showCatAxisTitle !== undefined) chartOptions.showCatAxisTitle = input.showCatAxisTitle
      if (input.valAxisTitle !== undefined) chartOptions.valAxisTitle = input.valAxisTitle
      if (input.showValAxisTitle !== undefined) chartOptions.showValAxisTitle = input.showValAxisTitle
      if (input.barDir !== undefined) chartOptions.barDir = input.barDir
      if (input.lineSize !== undefined) chartOptions.lineSize = input.lineSize
      if (input.lineSmooth !== undefined) chartOptions.lineSmooth = input.lineSmooth
      if (input.showPercent !== undefined) chartOptions.showPercent = input.showPercent
      if (input.valAxisMinVal !== undefined) chartOptions.valAxisMinVal = input.valAxisMinVal
      if (input.valAxisMaxVal !== undefined) chartOptions.valAxisMaxVal = input.valAxisMaxVal
      if (input.valAxisMajorUnit !== undefined) chartOptions.valAxisMajorUnit = input.valAxisMajorUnit
      if (input.catAxisLabelRotate !== undefined) chartOptions.catAxisLabelRotate = input.catAxisLabelRotate
      if (input.dataLabelPosition !== undefined) chartOptions.dataLabelPosition = input.dataLabelPosition
      if (input.dataLabelColor !== undefined) chartOptions.dataLabelColor = formatColor(input.dataLabelColor)
      if (input.chartColors && input.chartColors.length > 0) {
        chartOptions.chartColors = input.chartColors.map(color => formatColor(color))
      }

      // Add chart to slide
      targetSlide.addChart(pptxChartType, chartData, chartOptions)

      // Determine actual slide index
      const actualSlideIndex = input.slideIndex !== undefined && slides[input.slideIndex]
        ? input.slideIndex
        : slides.length - 1

      // Send live update event (presentation must be open in viewer)
      if (sendEvent) {
        sendEvent({
          type: "pptx-live-update",
          presentationId: id,
          fileId: input.fileId,
          operation: "add_chart",
          operationData: {
            slideIndex: actualSlideIndex,
            element: {
              id: `chart-${Date.now()}`,
              type: 'chart',
              x: input.x,
              y: input.y,
              width: input.width,
              height: input.height,
              chartType: input.chartType,
              data: input.data,
              title: input.title,
              showTitle: input.showTitle,
              showLegend: input.showLegend,
              legendPos: input.legendPos,
              catAxisTitle: input.catAxisTitle,
              showCatAxisTitle: input.showCatAxisTitle,
              valAxisTitle: input.valAxisTitle,
              showValAxisTitle: input.showValAxisTitle,
              barDir: input.barDir,
              lineSize: input.lineSize,
              lineSmooth: input.lineSmooth,
              showPercent: input.showPercent,
              chartColors: input.chartColors,
              valAxisMinVal: input.valAxisMinVal,
              valAxisMaxVal: input.valAxisMaxVal,
              valAxisMajorUnit: input.valAxisMajorUnit,
              catAxisLabelRotate: input.catAxisLabelRotate,
              dataLabelPosition: input.dataLabelPosition,
              dataLabelColor: input.dataLabelColor
            }
          },
          timestamp: Date.now()
        })
      }

      return {
        success: true,
        message: `${input.chartType.charAt(0).toUpperCase() + input.chartType.slice(1)} chart added`,
        presentationId: id,
        slideIndex: actualSlideIndex,
        fileId: input.fileId
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to add chart: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_add_chart',
    description: 'Add a chart to a slide. Supports bar, line, pie, and scatter charts. All position and size values (x, y, width, height) are percentages (0-100). Data format: array of series objects, each with name (required), labels (for bar/line/pie charts), and values (required). For scatter charts, first series contains X-axis values. IMPORTANT: The presentation must be open in the viewer. The fileId parameter is optional when the presentation is open - tools automatically route to the open presentation. After adding a chart to a slide, use pptx_evaluate_presentation to evaluate how the slide looks before moving on to the next slide or making further modifications.',
    schema: z.object({
      presentationId: z.string().optional().describe('ID of the presentation. Only needed if you have the presentationId from a previous operation.'),
      presentationName: z.string().optional().describe('Presentation name. Only needed if creating a new presentation.'),
      fileId: z.string().optional().describe('File ID of the presentation that is currently open in the viewer. Optional when the presentation is open - tools automatically route to the open presentation.'),
      slideIndex: z.number().optional().describe('Slide index (0-indexed). Defaults to last created slide'),
      x: z.number().describe('X position as percentage (0-100)'),
      y: z.number().describe('Y position as percentage (0-100)'),
      width: z.number().describe('Width as percentage (0-100)'),
      height: z.number().describe('Height as percentage (0-100)'),
      chartType: z.enum(['bar', 'line', 'pie', 'scatter']).describe('Type of chart to create'),
      data: z.array(z.object({
        name: z.string().describe('Series name'),
        labels: z.array(z.string()).optional().describe('Category labels (for bar/line/pie charts). Not used for scatter charts.'),
        values: z.array(z.number()).describe('Data values for this series')
      })).describe('Chart data as array of series. For scatter charts, first series contains X-axis values.'),
      title: z.string().optional().describe('Chart title'),
      showTitle: z.boolean().optional().describe('Whether to show chart title'),
      showLegend: z.boolean().optional().describe('Whether to show legend'),
      legendPos: z.enum(['b', 't', 'l', 'r']).optional().describe('Legend position: b=bottom, t=top, l=left, r=right'),
      catAxisTitle: z.string().optional().describe('Category axis title (X-axis for bar/line charts)'),
      showCatAxisTitle: z.boolean().optional().describe('Whether to show category axis title'),
      valAxisTitle: z.string().optional().describe('Value axis title (Y-axis for bar/line charts)'),
      showValAxisTitle: z.boolean().optional().describe('Whether to show value axis title'),
      barDir: z.enum(['bar', 'col']).optional().describe('Bar direction: bar=horizontal, col=vertical (for bar charts only)'),
      lineSize: z.number().optional().describe('Line width in points (for line charts only)'),
      lineSmooth: z.boolean().optional().describe('Whether to use smooth curves (for line charts only)'),
      showPercent: z.boolean().optional().describe('Whether to show percentages (for pie charts only)'),
      chartColors: z.array(z.string()).optional().describe('Array of hex colors without # prefix (e.g., ["4472C4", "ED7D31"])'),
      valAxisMinVal: z.number().optional().describe('Minimum value for value axis'),
      valAxisMaxVal: z.number().optional().describe('Maximum value for value axis'),
      valAxisMajorUnit: z.number().optional().describe('Major unit for value axis tick marks'),
      catAxisLabelRotate: z.number().optional().describe('Rotation angle for category axis labels in degrees'),
      dataLabelPosition: z.enum(['outEnd', 'inEnd', 'center', 'bestFit']).optional().describe('Position of data labels'),
      dataLabelColor: z.string().optional().describe('Color for data labels (hex without # prefix)'),
    }),
  }
)
