import { tool } from "@langchain/core/tools"
import { z } from "zod"
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { downloadFileFromS3, getAuthToken } from '../pptxUtils'
import { fileIdToPresentationIdMap, presentationStore } from './utils'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'
import { 
  extractTextFromSlideXml, 
  extractImagesFromSlideXml, 
  extractShapesFromSlideXml,
  checkLayoutIssues,
  checkTextOverflow,
  extractSlideDimensions
} from './evaluate-helpers'

export const evaluatePresentationTool = tool(
  async (input: {
    fileId?: string
    filePath?: string
  }, context: any) => {
    try {
      let filePath: string
      let isTempFile = false
      
      // Priority order for getting presentation:
      // 1. presentationContext from server context (frontend editor state - most current)
      // 2. presentationStore (agent-created presentations)
      // 3. Download from S3 (saved file)
      
      // First, check if presentationContext is available (current frontend editor state)
      const presentationContext = getServerContextValue<string>('presentationContext')
      let presentationData: { fileId?: string; slides?: any[] } | null = null
      
      if (presentationContext) {
        try {
          presentationData = JSON.parse(presentationContext)
        } catch (e) {
          console.warn('[evaluate-presentation] Failed to parse presentationContext:', e)
        }
      }
      
      // Check if presentationContext matches the requested fileId or we can use it
      if (presentationData && presentationData.slides && presentationData.slides.length > 0) {
        const contextFileId = presentationData.fileId
        // Use context if fileId matches or if no fileId provided
        if (!input.fileId || contextFileId === input.fileId) {
          // Convert slides from frontend format to PPTX using pptxgenjs
          // Note: We do a simplified conversion - just enough to create a valid PPTX for evaluation
          const PptxGenJS = (await import('pptxgenjs')).default
          const pptx = new PptxGenJS()
          pptx.layout = 'LAYOUT_16x9'
          pptx.author = 'Banbury Editor'
          
          // Convert frontend slides to PPTX slides
          for (const slide of presentationData.slides) {
            const pptxSlide = pptx.addSlide()
            
            // Handle background
            if (slide.background) {
              pptxSlide.background = { color: typeof slide.background === 'string' ? slide.background.replace('#', '') : slide.background }
            }
            
            // Add elements
            if (slide.elements && Array.isArray(slide.elements)) {
              for (const element of slide.elements) {
                if (element.type === 'text' && element.content) {
                  pptxSlide.addText(element.content, {
                    x: element.x || 0,
                    y: element.y || 0,
                    w: element.width || 50,
                    h: element.height || 25,
                    fontSize: element.fontSize || 18,
                    color: element.color || '363636',
                    bold: element.bold || false,
                    italic: element.italic || false,
                    align: element.align || 'left',
                  })
                } else if (element.type === 'image' && element.imageUrl) {
                  pptxSlide.addImage({
                    data: element.imageUrl,
                    x: element.x || 0,
                    y: element.y || 0,
                    w: element.width || 50,
                    h: element.height || 50,
                  })
                } else if (element.type === 'shape') {
                  pptxSlide.addShape(pptx.ShapeType.rect, {
                    x: element.x || 0,
                    y: element.y || 0,
                    w: element.width || 50,
                    h: element.height || 50,
                    fill: typeof element.fill === 'string' ? { color: element.fill } : element.fill || { color: 'CCCCCC' },
                  })
                }
              }
            }
            
            // Add notes if present
            if (slide.notes) {
              pptxSlide.addNotes(slide.notes)
            }
          }
          
          // Write to temp file for evaluation
          const tmpDir = os.tmpdir()
          const timestamp = Date.now()
          const tempFileName = `eval_pres_${timestamp}.pptx`
          const tempFilePath = path.join(tmpDir, tempFileName)
          
          await pptx.writeFile({ fileName: tempFilePath })
          filePath = tempFilePath
          isTempFile = true
        }
      }
      
      // Fallback to presentationStore if no context or context doesn't match
      if (!filePath && input.fileId) {
        const presentationId = fileIdToPresentationIdMap.get(input.fileId)
        if (presentationId && presentationStore.has(presentationId)) {
          const stored = presentationStore.get(presentationId)!
          const { pptx, slides } = stored
          
          if (pptx && slides && slides.length > 0) {
            // Write the current presentation to a temp file for evaluation
            const tmpDir = os.tmpdir()
            const timestamp = Date.now()
            const tempFileName = `eval_pres_${timestamp}.pptx`
            const tempFilePath = path.join(tmpDir, tempFileName)
            
            await pptx.writeFile({ fileName: tempFilePath })
            filePath = tempFilePath
            isTempFile = true
          }
        }
      }
      
      // Final fallback: download from S3
      if (!filePath) {
        if (input.fileId) {
          const authToken = getAuthToken(context)
          filePath = await downloadFileFromS3(input.fileId, authToken)
        } else if (input.filePath && fs.existsSync(input.filePath)) {
          filePath = input.filePath
        } else {
          throw new Error('Either fileId or filePath must be provided')
        }
      }
      
      // Read the PPTX file
      const fileBuffer = fs.readFileSync(filePath)
      
      // Load the PPTX as a ZIP archive
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(fileBuffer)
      
      // Find all slide XML files
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
          return numA - numB
        })
      
      if (slideFiles.length === 0) {
        // Clean up downloaded file
        if (input.fileId && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath)
          } catch {
            // Ignore cleanup errors
          }
        }
        
        return {
          success: false,
          error: "No slides found in the PPTX file",
          slideCount: 0,
          slides: [],
          evaluation: "The presentation appears to be empty with no slides."
        }
      }
      
      // Get slide dimensions from presentation XML
      const presentationXml = await zip.file('ppt/presentation.xml')?.async('string') || ''
      const slideDimensions = extractSlideDimensions(presentationXml)
      const slideWidthEmu = slideDimensions?.widthEmu || 9144000 // Default: 10 inches = 960 points
      const slideHeightEmu = slideDimensions?.heightEmu || 6858000 // Default: 7.5 inches = 720 points
      
      const slides: Array<{
        slideIndex: number
        title?: string
        content?: string[]
        textElementCount: number
        imageCount: number
        shapeCount: number
        hasNotes: boolean
        layoutIssues?: Array<{
          type: 'right_overflow' | 'bottom_overflow' | 'negative_position' | 'text_overflow'
          severity: 'error' | 'warning'
          message: string
        }>
      }> = []
      
      let totalTextElements = 0
      let totalImages = 0
      let totalShapes = 0
      let slidesWithNotes = 0
      let slidesWithLayoutIssues = 0
      let totalLayoutIssues = 0
      
      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i]
        const slideXml = await zip.file(slideFile)?.async('string')
        
        if (!slideXml) continue
        
        // Extract text content from slide XML
        const textContent = extractTextFromSlideXml(slideXml)
        const imageCount = extractImagesFromSlideXml(slideXml)
        const shapeCount = extractShapesFromSlideXml(slideXml)
        
        // Try to get notes for this slide
        const notesFile = `ppt/notesSlides/notesSlide${i + 1}.xml`
        let hasNotes = false
        try {
          const notesXml = await zip.file(notesFile)?.async('string')
          if (notesXml) {
            const notesText = extractTextFromSlideXml(notesXml)
            hasNotes = notesText.length > 0
            if (hasNotes) slidesWithNotes++
          }
        } catch {
          // Notes file may not exist
        }
        
        // Heuristic: first text element is often the title
        const title = textContent.length > 0 ? textContent[0] : undefined
        const content = textContent.length > 1 ? textContent.slice(1) : []
        
        // Check for layout issues on this slide
        const layoutCheck = checkLayoutIssues(slideXml, slideWidthEmu, slideHeightEmu)
        const textOverflowCheck = checkTextOverflow(slideXml)
        
        const layoutIssues: Array<{
          type: 'right_overflow' | 'bottom_overflow' | 'negative_position' | 'text_overflow'
          severity: 'error' | 'warning'
          message: string
        }> = []
        
        if (layoutCheck.hasOverflow) {
          layoutCheck.overflowIssues.forEach(issue => {
            layoutIssues.push({
              type: issue.type,
              severity: issue.severity,
              message: issue.message
            })
            totalLayoutIssues++
          })
        }
        
        if (textOverflowCheck.hasTextOverflow) {
          textOverflowCheck.overflowIssues.forEach(issue => {
            layoutIssues.push({
              type: 'text_overflow',
              severity: 'warning',
              message: issue.message
            })
            totalLayoutIssues++
          })
        }
        
        if (layoutIssues.length > 0) {
          slidesWithLayoutIssues++
        }
        
        totalTextElements += textContent.length
        totalImages += imageCount
        totalShapes += shapeCount
        
        slides.push({
          slideIndex: i,
          title,
          content: content.length > 0 ? content : undefined,
          textElementCount: textContent.length,
          imageCount,
          shapeCount,
          hasNotes,
          ...(layoutIssues.length > 0 && { layoutIssues })
        })
      }
      
      // Generate evaluation summary
      const avgTextPerSlide = totalTextElements / slides.length
      const avgImagesPerSlide = totalImages / slides.length
      const avgShapesPerSlide = totalShapes / slides.length
      
      const evaluation = {
        overview: {
          totalSlides: slides.length,
          slidesWithContent: slides.filter(s => s.textElementCount > 0).length,
          slidesWithImages: slides.filter(s => s.imageCount > 0).length,
          slidesWithShapes: slides.filter(s => s.shapeCount > 0).length,
          slidesWithNotes: slidesWithNotes,
          slidesWithLayoutIssues: slidesWithLayoutIssues,
        },
        statistics: {
          totalTextElements,
          totalImages,
          totalShapes,
          totalLayoutIssues,
          averageTextPerSlide: Math.round(avgTextPerSlide * 10) / 10,
          averageImagesPerSlide: Math.round(avgImagesPerSlide * 10) / 10,
          averageShapesPerSlide: Math.round(avgShapesPerSlide * 10) / 10,
        },
        assessment: {
          contentRichness: avgTextPerSlide > 5 ? 'high' : avgTextPerSlide > 2 ? 'medium' : 'low',
          visualElements: totalImages + totalShapes > slides.length * 2 ? 'high' : totalImages + totalShapes > 0 ? 'medium' : 'low',
          structure: slides.length >= 10 ? 'comprehensive' : slides.length >= 5 ? 'moderate' : 'brief',
          layoutQuality: slidesWithLayoutIssues === 0 ? 'good' : slidesWithLayoutIssues <= slides.length * 0.2 ? 'acceptable' : 'needs_attention',
        },
        recommendations: [] as string[]
      }
      
      // Generate recommendations
      if (slides.length < 3) {
        evaluation.recommendations.push('Consider adding more slides for a more comprehensive presentation')
      }
      if (totalImages === 0 && totalShapes === 0) {
        evaluation.recommendations.push('Consider adding visual elements (images or shapes) to make the presentation more engaging')
      }
      if (avgTextPerSlide < 2) {
        evaluation.recommendations.push('Some slides may benefit from more detailed content')
      }
      if (avgTextPerSlide > 10) {
        evaluation.recommendations.push('Some slides may have too much text - consider splitting content across multiple slides')
      }
      if (slidesWithNotes === 0) {
        evaluation.recommendations.push('Consider adding speaker notes to help with presentation delivery')
      }
      if (slides.filter(s => !s.title).length > slides.length * 0.3) {
        evaluation.recommendations.push('Many slides are missing titles - consider adding titles for better structure')
      }
      
      // Add layout-specific recommendations
      if (slidesWithLayoutIssues > 0) {
        const errorIssues = slides.filter(s => s.layoutIssues?.some(issue => issue.severity === 'error')).length
        if (errorIssues > 0) {
          evaluation.recommendations.push(`Found ${errorIssues} slide(s) with layout errors - some elements are positioned outside the slide boundaries and may not be visible during presentation`)
        }
        const warningIssues = slides.filter(s => s.layoutIssues?.some(issue => issue.severity === 'warning')).length
        if (warningIssues > 0) {
          evaluation.recommendations.push(`Found ${warningIssues} slide(s) with layout warnings - some elements may extend beyond the slide edges or have text that might overflow`)
        }
      }
      
      // Clean up downloaded/temp files
      if (fs.existsSync(filePath) && (input.fileId || isTempFile)) {
        try {
          fs.unlinkSync(filePath)
        } catch {
          // Ignore cleanup errors
        }
      }
      
      return {
        success: true,
        message: `Successfully evaluated presentation with ${slides.length} slide(s)`,
        slideCount: slides.length,
        slides,
        evaluation,
        summary: `Presentation contains ${slides.length} slides with ${totalTextElements} text elements, ${totalImages} images, and ${totalShapes} shapes. ${evaluation.assessment.structure} structure with ${evaluation.assessment.contentRichness} content richness and ${evaluation.assessment.visualElements} visual elements. Layout quality: ${evaluation.assessment.layoutQuality}${slidesWithLayoutIssues > 0 ? ` (${slidesWithLayoutIssues} slide(s) with layout issues)` : ''}.`
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to evaluate presentation: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_evaluate_presentation',
    description: 'Evaluate a PowerPoint presentation to see how it looks. Downloads the presentation, analyzes its structure, content, and visual elements, and provides an assessment with recommendations. CRITICAL WORKFLOW: After creating or modifying a slide (using pptx_create_slide, pptx_add_text, pptx_add_shape, pptx_add_image, or pptx_set_slide_background), you MUST call this tool with the returned fileId to evaluate the slide before moving on to the next slide. This ensures quality and allows you to make adjustments if needed. Always evaluate after each slide modification.',
    schema: z.object({
      fileId: z.string().optional().describe('File ID of the presentation to evaluate (from S3)'),
      filePath: z.string().optional().describe('Local file path to the presentation (alternative to fileId)'),
    }),
  }
)
