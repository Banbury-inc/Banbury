import type { NextApiRequest, NextApiResponse } from 'next'
import { mkdir, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import Anthropic from '@anthropic-ai/sdk'
import { chromium } from 'playwright'
import { CONFIG } from '../../../frontend/config/config'
import { authenticateTerminalUser, extractBearerToken } from '../terminal/handlers/authenticateTerminalUser'

export { API_CONFIG as config } from '../assistant/langgraph-stream/constants'

interface MarketingIdea {
  description: string
  action: string
}

interface MarketingAssetsRequest {
  idea?: MarketingIdea
  captureUrl?: string
  origin?: string
}

interface MarketingAssetFile {
  file_id?: string
  file_name: string
  file_path: string
  file_size?: number
}

interface UploadResult {
  file_info?: MarketingAssetFile
}

function isMarketingIdea(value: unknown): value is MarketingIdea {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<MarketingIdea>
  return typeof candidate.description === 'string' && typeof candidate.action === 'string'
}

function getSafeCaptureUrl(captureUrl?: string, origin?: string) {
  const fallbackOrigin = origin?.startsWith('http') ? origin : 'https://banbury.io'
  const fallbackUrl = `${fallbackOrigin.replace(/\/$/, '')}/`

  if (!captureUrl) return fallbackUrl

  try {
    const parsed = new URL(captureUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return fallbackUrl
    return parsed.toString()
  } catch {
    return fallbackUrl
  }
}

function getOriginFromCaptureUrl(captureUrl?: string, origin?: string) {
  if (origin?.startsWith('http')) return origin.replace(/\/$/, '')

  if (!captureUrl) return 'https://banbury.io'

  try {
    const parsed = new URL(captureUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'https://banbury.io'
    return parsed.origin
  } catch {
    return 'https://banbury.io'
  }
}

function getFeatureCapturePath(idea: MarketingIdea) {
  const text = `${idea.description} ${idea.action}`.toLowerCase()
  const routeRules = [
    { keywords: ['meeting', 'recording', 'transcript', 'transcription', 'recall'], path: '/meeting-agent' },
    { keywords: ['knowledge', 'graph', 'memory', 'memories'], path: '/knowledge' },
    { keywords: ['workspace', 'file', 'folder', 'email', 'calendar', 'task', 'spreadsheet', 'document', 'powerpoint', 'assistant', 'chat'], path: '/workspaces' },
    { keywords: ['desktop', 'download', 'mac', 'windows', 'linux'], path: '/download' },
    { keywords: ['api', 'developer', 'integration'], path: '/api' },
    { keywords: ['feature', 'launch', 'product'], path: '/features' }
  ]

  const match = routeRules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))
  return match?.path || '/features'
}

function getFeatureCaptureUrl(idea: MarketingIdea, captureUrl?: string, origin?: string) {
  const baseOrigin = getOriginFromCaptureUrl(captureUrl, origin)
  return `${baseOrigin}${getFeatureCapturePath(idea)}`
}

function getSafeFileName(input: string) {
  const safe = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  return safe || 'marketing-asset'
}

async function uploadBufferToS3({
  buffer,
  fileName,
  folder,
  mimeType,
  authToken
}: {
  buffer: Buffer
  fileName: string
  folder: string
  mimeType: string
  authToken: string
}) {
  const blob = new Blob([buffer], { type: mimeType })
  const filePath = `${folder}/${fileName}`
  const form = new FormData()
  form.append('file', blob, fileName)
  form.append('device_name', 'web-editor')
  form.append('file_path', filePath)
  form.append('file_parent', folder)

  const uploadResponse = await fetch(`${CONFIG.url}/files/upload_to_s3/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`
    } as any,
    body: form as any
  })

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text().catch(() => '')
    throw new Error(`Upload failed: ${text || uploadResponse.statusText}`)
  }

  const uploaded = await uploadResponse.json() as UploadResult
  return uploaded.file_info || {
    file_name: fileName,
    file_path: filePath,
    file_size: buffer.length
  }
}

async function generatePostText(idea: MarketingIdea) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  const prompt = `Create high-performing marketing post copy for this Banbury feature idea.

Description: ${idea.description}
Action: ${idea.action}

Write for reach and engagement. Lead with a specific hook, make the pain point obvious, show the before/after value, and keep the copy native to the recommended channel. Avoid generic launch language, corporate phrasing, and vague claims.

Return ready-to-use text for a social post or short email campaign. Keep it specific, clear, customer-facing, and easy to skim.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  const firstTextBlock = message.content.find((block) => block.type === 'text')
  if (firstTextBlock?.type !== 'text') throw new Error('No post text returned by AI')

  return firstTextBlock.text.trim()
}

async function captureProductMedia({
  captureUrl,
  idea,
  authToken,
  tempDir
}: {
  captureUrl: string
  idea: MarketingIdea
  authToken: string
  tempDir: string
}) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: {
      dir: tempDir,
      size: { width: 1440, height: 1000 }
    }
  })

  try {
    await context.addInitScript((token) => {
      globalThis.localStorage.setItem('authToken', token)
    }, authToken)

    const page = await context.newPage()
    await page.goto(captureUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(2500)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+F' : 'Control+F').catch(() => undefined)
    await page.keyboard.type(idea.description.split(' ').slice(0, 3).join(' ')).catch(() => undefined)
    await page.keyboard.press('Escape').catch(() => undefined)
    await page.waitForTimeout(800)
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(1200)

    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: 'png'
    })

    await page.mouse.wheel(0, -500)
    await page.waitForTimeout(1200)

    const video = page.video()
    await context.close()
    const videoPath = video ? await video.path() : null
    if (!videoPath) throw new Error('Video capture was not created')

    return {
      screenshotBuffer,
      videoBuffer: await readFile(videoPath)
    }
  } finally {
    await browser.close()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Anthropic API key not configured' })
    return
  }

  const token = extractBearerToken(req)
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' })
    return
  }

  try {
    const username = await authenticateTerminalUser(req)
    const isAdmin = username === 'mmills' || username === 'mmills6060@gmail.com'

    if (!isAdmin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { idea, captureUrl, origin } = req.body as MarketingAssetsRequest
    if (!isMarketingIdea(idea)) {
      res.status(400).json({ error: 'Missing marketing idea' })
      return
    }

    const safeCaptureUrl = getSafeCaptureUrl(getFeatureCaptureUrl(idea, captureUrl, origin), origin)
    const postText = await generatePostText(idea)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseName = `${getSafeFileName(idea.description)}-${timestamp}`
    const folder = 'marketing-assets'
    const tempDir = join(tmpdir(), `banbury-marketing-${timestamp}`)

    await mkdir(tempDir, { recursive: true })

    try {
      const { screenshotBuffer, videoBuffer } = await captureProductMedia({
        captureUrl: safeCaptureUrl,
        idea,
        authToken: token,
        tempDir
      })
      const textBuffer = Buffer.from(postText, 'utf8')

      const screenshotFile = await uploadBufferToS3({
        buffer: screenshotBuffer,
        fileName: `${baseName}.png`,
        folder,
        mimeType: 'image/png',
        authToken: token
      })
      const videoFile = await uploadBufferToS3({
        buffer: videoBuffer,
        fileName: `${baseName}.webm`,
        folder,
        mimeType: 'video/webm',
        authToken: token
      })
      const postTextFile = await uploadBufferToS3({
        buffer: textBuffer,
        fileName: `${baseName}.txt`,
        folder,
        mimeType: 'text/plain',
        authToken: token
      })

      res.status(200).json({
        success: true,
        asset: {
          postText,
          screenshotPreview: `data:image/png;base64,${screenshotBuffer.toString('base64')}`,
          videoPreview: `data:video/webm;base64,${videoBuffer.toString('base64')}`,
          captureUrl: safeCaptureUrl,
          screenshotFile,
          videoFile,
          postTextFile
        }
      })
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  } catch (error) {
    console.error('Marketing asset creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const lowerMessage = errorMessage.toLowerCase()
    const statusCode = lowerMessage.includes('auth') || lowerMessage.includes('token') ? 401 : 500
    res.status(statusCode).json({ error: errorMessage })
  }
}
