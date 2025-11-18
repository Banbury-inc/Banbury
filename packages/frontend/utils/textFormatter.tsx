import React from 'react'

interface FormattedTextProps {
  text: string
  className?: string
}

export function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null

  // Function to safely parse and render HTML content
  const parseHtmlContent = (htmlString: string) => {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlString

    // Function to convert DOM nodes to React elements
    const nodeToReactElement = (node: Node, index: number): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        // Convert plain URLs to clickable links in text nodes
        return formatUrlsInText(text, index)
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const tagName = element.tagName.toLowerCase()
        const props: any = { key: index }

        // Handle different HTML tags
        switch (tagName) {
          case 'a':
            props.href = element.getAttribute('href')
            props.target = '_blank'
            props.rel = 'noopener noreferrer'
            props.className = 'text-blue-400 hover:text-blue-300 underline break-all'
            break
          case 'br':
            return <br key={index} />
          case 'p':
            props.className = 'mb-2 last:mb-0'
            break
          case 'strong':
          case 'b':
            props.className = 'font-semibold'
            break
          case 'em':
          case 'i':
            props.className = 'italic'
            break
          default:
            // For other tags, just pass through the attributes
            Array.from(element.attributes).forEach(attr => {
              if (attr.name !== 'class') {
                props[attr.name] = attr.value
              }
            })
        }

        // Recursively process child nodes
        const children = Array.from(element.childNodes).map((child, childIndex) =>
          nodeToReactElement(child, childIndex)
        )

        return React.createElement(tagName, props, ...children)
      }

      return null
    }

    // Convert all child nodes to React elements
    return Array.from(tempDiv.childNodes).map((node, index) =>
      nodeToReactElement(node, index)
    )
  }

  // Function to convert URLs to clickable links in plain text
  const formatUrlsInText = (text: string, baseIndex: number) => {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi
    const parts = text.split(urlRegex)
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={`${baseIndex}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all"
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  // Check if the text contains HTML tags
  const hasHtmlTags = /<[^>]*>/g.test(text)

  if (hasHtmlTags) {
    // Parse and render HTML content
    return (
      <div className={`${className}`}>
        {parseHtmlContent(text)}
      </div>
    )
  } else {
    // Handle plain text with URLs and line breaks
    const formatLineBreaks = (text: string) => {
      return text.split('\n').map((line, index, array) => (
        <React.Fragment key={index}>
          {formatUrlsInText(line, index)}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      ))
    }

    return (
      <div className={`whitespace-pre-wrap ${className}`}>
        {formatLineBreaks(text)}
      </div>
    )
  }
}

// Function to extract plain text from formatted content (for editing)
export function extractPlainText(html: string): string {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = html
  return textarea.value
}
