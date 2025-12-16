import type { NextApiRequest, NextApiResponse } from 'next'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB

interface FetchImageResponse {
  success: boolean
  dataUrl?: string
  error?: string
  contentType?: string
  size?: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FetchImageResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { url } = req.body

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' })
  }

  // Validate URL protocol (only http/https)
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only HTTP/HTTPS URLs are allowed' 
      })
    }
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Invalid URL' })
  }

  try {
    // Fetch the image with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BanburyImageFetcher/1.0)',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Failed to fetch image: HTTP ${response.status}`,
      })
    }

    // Check content type
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: `Invalid content type: ${contentType}. Expected image/*`,
      })
    }

    // Check content length
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
      return res.status(413).json({
        success: false,
        error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      })
    }

    // Read the image data
    const arrayBuffer = await response.arrayBuffer()
    
    // Double-check size after download
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      return res.status(413).json({
        success: false,
        error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      })
    }

    // Convert to base64 data URL
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`

    return res.status(200).json({
      success: true,
      dataUrl,
      contentType,
      size: arrayBuffer.byteLength,
    })
  } catch (error: any) {
    console.error('Error fetching image:', error)
    
    if (error.name === 'AbortError') {
      return res.status(408).json({
        success: false,
        error: 'Request timeout',
      })
    }

    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch image',
    })
  }
}

