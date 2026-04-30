import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticateTerminalUser } from './handlers/authenticateTerminalUser'
import { getTerminalRuntime } from './handlers/terminalRuntime'

interface CreateSessionRequestBody {
  cwd?: string
  shell?: string
  cols?: number
  rows?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const userId = await authenticateTerminalUser(req)
    const body = (req.body || {}) as CreateSessionRequestBody
    const runtime = getTerminalRuntime()
    const { sessionId, sessionToken, summary } = runtime.createSession({
      userId,
      cwd: body.cwd,
      shell: body.shell,
      cols: body.cols,
      rows: body.rows,
    })

    res.status(200).json({
      sessionId,
      sessionToken,
      socketPath: '/api/terminal/socket',
      summary,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create terminal session'
    res.status(400).json({ error: message })
  }
}
