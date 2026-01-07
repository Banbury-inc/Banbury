import { tool } from "@langchain/core/tools"
import { z } from "zod"

/**
 * Slide outline extracted from PPTX
 */
interface SlideOutline {
  slideIndex: number
  title?: string
  content?: string[]
  notes?: string
}

/**
 * PPTX Parse Outline Tool
 * 
 * Parses an attached PPTX file (provided as base64) and extracts a compact
 * JSON outline of the presentation content. This enables the AI to understand
 * the structure of an existing presentation and make intelligent edits.
 * 
 * Usage flow:
 * 1. User attaches a .pptx file to their message
 * 2. downloadFiles.ts converts it to base64 in the message content
 * 3. AI calls pptx_parse_outline with the base64 data
 * 4. Tool returns a JSON outline of slides (titles, content, notes)
 * 5. AI can then call create_file to generate a modified version
 */
export const pptxParseOutlineTool = tool(
  async (input: { base64Data: string; fileName?: string }) => {
    try {
      // Dynamic import JSZip for parsing PPTX (which is a ZIP archive)
      const JSZip = (await import('jszip')).default
      
      // Decode base64 to buffer
      const buffer = Buffer.from(input.base64Data, 'base64')
      
      // Load the PPTX as a ZIP archive
      const zip = await JSZip.loadAsync(buffer)
      
      // Find all slide XML files
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
          return numA - numB
        })
      
      if (slideFiles.length === 0) {
        return {
          success: false,
          error: "No slides found in the PPTX file",
          slides: []
        }
      }
      
      const slides: SlideOutline[] = []
      
      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i]
        const slideXml = await zip.file(slideFile)?.async('string')
        
        if (!slideXml) continue
        
        // Extract text content from slide XML
        const textContent = extractTextFromSlideXml(slideXml)
        
        // Try to get notes for this slide
        const notesFile = `ppt/notesSlides/notesSlide${i + 1}.xml`
        let notes: string | undefined
        try {
          const notesXml = await zip.file(notesFile)?.async('string')
          if (notesXml) {
            notes = extractTextFromSlideXml(notesXml).join(' ').trim()
          }
        } catch {
          // Notes file may not exist
        }
        
        // Heuristic: first text element is often the title
        const title = textContent.length > 0 ? textContent[0] : undefined
        const content = textContent.length > 1 ? textContent.slice(1) : []
        
        slides.push({
          slideIndex: i,
          title,
          content: content.length > 0 ? content : undefined,
          notes: notes || undefined
        })
      }
      
      return {
        success: true,
        fileName: input.fileName || 'presentation.pptx',
        slideCount: slides.length,
        slides,
        summary: `Parsed ${slides.length} slides from the presentation`
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing PPTX'
      return {
        success: false,
        error: errorMessage,
        slides: []
      }
    }
  },
  {
    name: 'pptx_parse_outline',
    description:
      'Parse an attached PowerPoint file (.pptx) to extract its content outline. ' +
      'Returns a JSON structure with slide titles, content text, and notes. ' +
      'Use this tool when you need to understand the structure of an existing presentation ' +
      'before making modifications. After parsing, you can use create_file to generate ' +
      'a modified version of the presentation.',
    schema: z.object({
      base64Data: z.string().describe('Base64-encoded PPTX file data (from attached file)'),
      fileName: z.string().optional().describe('Original file name for reference'),
    }),
  }
)

/**
 * Extract text content from slide XML
 * Simplified parser that extracts text from <a:t> elements
 */
function extractTextFromSlideXml(xml: string): string[] {
  const texts: string[] = []
  
  // Match all <a:t>...</a:t> text elements
  const textRegex = /<a:t>([^<]*)<\/a:t>/g
  let match
  
  // Group texts by paragraph (accumulate until we hit a paragraph break)
  let currentParagraph = ''
  let inParagraph = false
  
  // Track position in XML
  let lastIndex = 0
  
  while ((match = textRegex.exec(xml)) !== null) {
    const text = match[1]
    
    // Check if there's a paragraph break between last match and this one
    const between = xml.substring(lastIndex, match.index)
    const hasParagraphBreak = between.includes('</a:p>') || between.includes('<a:p>')
    
    if (hasParagraphBreak && currentParagraph.trim()) {
      texts.push(currentParagraph.trim())
      currentParagraph = ''
    }
    
    currentParagraph += text
    lastIndex = match.index + match[0].length
    inParagraph = true
  }
  
  // Don't forget the last paragraph
  if (currentParagraph.trim()) {
    texts.push(currentParagraph.trim())
  }
  
  // Filter out empty strings and very short strings that are likely noise
  return texts.filter(t => t.length > 0)
}
