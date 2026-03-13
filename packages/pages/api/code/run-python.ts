import type { NextApiRequest, NextApiResponse } from 'next'
import { executePython } from './handlers/executePython'
import { authenticateTerminalUser } from '../terminal/handlers/authenticateTerminalUser'
import { stageRuntimeFile, getRuntimeS3RootAbsolutePath } from '../terminal/handlers/stageRuntimeFile'

interface RunPythonRequestBody {
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
    const body = (req.body || {}) as RunPythonRequestBody
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

    const staged = await stageRuntimeFile({ filePath, content })
    const result = await executePython({
      cwd: getRuntimeS3RootAbsolutePath(),
      relativeFilePath: staged.relativePath,
    })

    res.status(200).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run python file'
    res.status(400).json({ error: message })
  }
}
