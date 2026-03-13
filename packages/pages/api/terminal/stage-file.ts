import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticateTerminalUser } from './handlers/authenticateTerminalUser'
import { stageRuntimeFile } from './handlers/stageRuntimeFile'

interface StageFileRequestBody {
  filePath?: string
  content?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    await authenticateTerminalUser(req)
    const body = (req.body || {}) as StageFileRequestBody
    const filePath = (body.filePath || '').trim()
    const content = body.content ?? ''

    if (!filePath) {
      res.status(400).json({ error: 'filePath is required' })
      return
    }

    if (typeof content !== 'string') {
      res.status(400).json({ error: 'content must be a string' })
      return
    }

    const result = await stageRuntimeFile({ filePath, content })
    res.status(200).json({
      relativePath: result.relativePath,
      cwd: result.cwd,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to stage runtime file'
    res.status(400).json({ error: message })
  }
}
