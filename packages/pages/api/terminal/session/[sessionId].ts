import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticateTerminalUser } from '../handlers/authenticateTerminalUser'
import { getTerminalRuntime } from '../handlers/terminalRuntime'

interface CloseSessionBody {
  sessionToken?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const sessionIdParam = req.query.sessionId
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam

  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId' })
    return
  }

  try {
    const userId = await authenticateTerminalUser(req)
    const runtime = getTerminalRuntime()
    const body = (req.body || {}) as CloseSessionBody
    const sessionToken = body.sessionToken || ''

    runtime.authorizeSession(sessionId, sessionToken, userId)
    runtime.closeSession(sessionId, userId)
    res.status(200).json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to close terminal session'
    res.status(400).json({ error: message })
  }
}
