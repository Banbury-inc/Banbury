import type { NextApiRequest, NextApiResponse } from 'next'

function getGooglePlacesApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY
}

function parsePhotoResourceName(name: string): string[] | null {
  const segments = name.split('/').filter(Boolean)
  if (segments.length !== 4) return null
  if (segments[0] !== 'places') return null
  if (segments[2] !== 'photos') return null

  return segments
}

function parsePhotoDimension(value: string | string[] | undefined, fallback: number): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN
  if (!Number.isFinite(parsed)) return fallback

  return Math.min(4800, Math.max(1, parsed))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  const raw = req.query.name
  const name = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : ''
  if (!name || name.length > 2048) return res.status(400).end()

  const segments = parsePhotoResourceName(name)
  if (!segments) return res.status(400).end()

  const apiKey = getGooglePlacesApiKey()
  if (!apiKey) return res.status(503).end()

  const encodedPath = segments.map(encodeURIComponent).join('/')
  const maxWidthPx = parsePhotoDimension(req.query.maxWidthPx, 400)
  const maxHeightPx = parsePhotoDimension(req.query.maxHeightPx, 400)
  const params = new URLSearchParams({
    maxWidthPx: String(maxWidthPx),
    maxHeightPx: String(maxHeightPx),
  })
  const mediaUrl = `https://places.googleapis.com/v1/${encodedPath}/media?${params.toString()}`

  let upstream: Response
  try {
    upstream = await fetch(mediaUrl, {
      headers: {
        'X-Goog-Api-Key': apiKey,
      },
    })
  } catch {
    return res.status(502).end()
  }

  if (!upstream.ok) return res.status(502).end()

  const contentType = upstream.headers.get('content-type') || 'image/jpeg'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')

  const buf = await upstream.arrayBuffer()
  return res.status(200).send(Buffer.from(buf))
}
