import { Box } from '@mui/material'
import { useEffect, useRef, useState, ReactNode } from 'react'
import TableOfContents from './TableOfContents'

interface Heading {
  id: string
  title: string
  level: number
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}


export default function DocPageLayout({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    if (!contentRef.current) return

    const extractHeadings = () => {
      const contentElement = contentRef.current
      if (!contentElement) {
        console.log('No content element found')
        return
      }

      const extractedHeadings: Heading[] = []
      
      // Find all elements with data-typography-variant attribute
      const typographyElements = contentElement.querySelectorAll('[data-typography-variant]')
      console.log('Total typography elements:', typographyElements.length)
      
      typographyElements.forEach((element, index) => {
        const variant = element.getAttribute('data-typography-variant')
        const textContent = element.textContent?.trim()
        
        console.log(`Element ${index}:`, {
          variant,
          textContent: textContent?.substring(0, 50),
          hasId: !!element.id,
          id: element.id
        })
        
        // Only process heading variants (h1, h2, h3, h4)
        const headingVariants = ['h1', 'h2', 'h3', 'h4']
        if (!variant || !headingVariants.includes(variant)) return
        if (!textContent || textContent.length === 0 || textContent.length > 100) return
        
        let id = element.id
        if (!id) {
          id = generateId(textContent)
          element.id = id
        }
        
        // Map variant to heading level
        const levelMap: Record<string, number> = {
          'h1': 1,
          'h2': 2,
          'h3': 3,
          'h4': 4
        }
        const level = levelMap[variant] || 4
        
        // Check if we already have this heading
        if (!extractedHeadings.some(h => h.id === id)) {
          extractedHeadings.push({
            id,
            title: textContent,
            level
          })
        }
      })
      
      console.log('Extracted headings:', extractedHeadings)
      setHeadings(extractedHeadings)
    }

    // Run extraction multiple times to catch late-rendered content
    const timeoutId1 = setTimeout(extractHeadings, 100)
    const timeoutId2 = setTimeout(extractHeadings, 500)
    const timeoutId3 = setTimeout(extractHeadings, 1000)
    
    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
    }
  }, [children])

  return (
    <>
      <Box sx={{ width: '100%', maxWidth: '800px', overflow: 'visible' }} ref={contentRef}>
        {children}
      </Box>
      <TableOfContents headings={headings} />
    </>
  )
}
