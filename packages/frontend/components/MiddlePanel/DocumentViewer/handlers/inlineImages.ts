export interface InlineImagesParams {
  html: string
}

export interface InlineImagesStats {
  totalImages: number
  inlinedImages: number
  skippedImages: number
}

export interface InlineImagesResult {
  html: string
  stats: InlineImagesStats
}

function isDataUri(src: string): boolean {
  return src.trim().startsWith('data:')
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function fetchAsDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src)
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await blobToDataUrl(blob)
    return dataUrl || null
  } catch {
    return null
  }
}

export async function inlineImagesInHtml({ html }: InlineImagesParams): Promise<InlineImagesResult> {
  if (!html || typeof html !== 'string') {
    return {
      html,
      stats: { totalImages: 0, inlinedImages: 0, skippedImages: 0 },
    }
  }

  // Use a detached DOM to safely manipulate the HTML fragment
  const container = document.createElement('div')
  container.innerHTML = html

  const images = Array.from(container.querySelectorAll('img[src]')) as HTMLImageElement[]
  let inlinedImages = 0
  let skippedImages = 0

  await Promise.all(
    images.map(async (img) => {
      const src = (img.getAttribute('src') || '').trim()
      if (!src) {
        skippedImages += 1
        return
      }
      if (isDataUri(src)) {
        skippedImages += 1
        return
      }
      const dataUrl = await fetchAsDataUrl(src)
      if (dataUrl) {
        img.setAttribute('src', dataUrl)
        inlinedImages += 1
      } else {
        skippedImages += 1
      }
    })
  )

  return {
    html: container.innerHTML,
    stats: { totalImages: images.length, inlinedImages, skippedImages },
  }
}


