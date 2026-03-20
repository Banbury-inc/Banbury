import { cn } from '../../../utils'
import { useEffect, useState } from 'react'

interface Heading {
  id: string
  title: string
  level: number
}

interface TableOfContentsProps {
  headings: Heading[]
}

function headingIndentClass(level: number): string {
  if (level <= 2) return ''
  const steps = level - 2
  const map: Record<number, string> = { 1: 'ps-2', 2: 'ps-4', 3: 'ps-6', 4: 'ps-8' }
  return map[steps] ?? 'ps-8'
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState<string>('')

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

  function handleNavigate(id: string) {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="On this page"
      className={cn(
        'fixed right-10 top-[120px] hidden h-fit max-h-[calc(100vh-140px)] w-60 overflow-y-auto lg:block',
        'scrollbar-thin scrollbar-thumb-border scrollbar-track-background hover:scrollbar-thumb-muted-foreground'
      )}
    >
      <p className="mb-2 text-sm font-semibold text-foreground">
        On this page
      </p>
      <ul className="flex flex-col gap-1">
        {headings.map((heading) => {
          const isActive = activeHeading === heading.id
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  'block text-sm font-sans transition-colors',
                  headingIndentClass(heading.level),
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavigate(heading.id)
                }}
              >
                {heading.title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
