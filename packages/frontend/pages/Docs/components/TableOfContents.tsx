import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

interface Heading {
  id: string
  title: string
  level: number
}

interface TableOfContentsProps {
  headings: Heading[]
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState<string>('')

  // Debug: Log headings received
  console.log('TableOfContents received headings:', headings)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-20% 0% -80% 0%',
        threshold: 0
      }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [headings])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        right: '40px',
        top: '120px',
        width: '240px',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 140px)',
        overflowY: 'auto',
        display: { xs: 'none', lg: 'block' },
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.05)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.3)',
        },
      }}
    >
      <Typography
        sx={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#ffffff',
          mb: 2,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        On this page
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {headings.map((heading) => (
          <Typography
            key={heading.id}
            onClick={() => handleClick(heading.id)}
            sx={{
              fontSize: '0.875rem',
              color: activeHeading === heading.id ? '#3b82f6' : '#ffffff',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: '#60a5fa'
              },
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              pl: heading.level === 2 ? 0 : (heading.level - 2) * 1,
            }}
          >
            {heading.title}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}
