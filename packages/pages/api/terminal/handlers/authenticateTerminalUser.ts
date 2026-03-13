import type { NextApiRequest } from 'next'

interface ValidateTokenResponse {
  valid?: boolean
  username?: string
}

const DEFAULT_BACKEND_URL = 'https://www.api.dev.banbury.io'

export function extractBearerToken(req: NextApiRequest) {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.replace('Bearer ', '').trim()
}

export async function authenticateTerminalToken(token: string): Promise<string> {
  if (!token) throw new Error('Missing authorization token')
  const backendUrl = process.env.CLOUD_BACKEND_URL || DEFAULT_BACKEND_URL
  const response = await fetch(`${backendUrl}/authentication/validate-token/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) throw new Error('Authentication failed')
  const payload = (await response.json()) as ValidateTokenResponse
  if (!payload.valid || !payload.username) throw new Error('Invalid authentication token')
  return payload.username
}

export async function authenticateTerminalUser(req: NextApiRequest): Promise<string> {
  const token = extractBearerToken(req)
  if (!token) throw new Error('Missing authorization token')
  return authenticateTerminalToken(token)
}
