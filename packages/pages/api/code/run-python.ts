import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { executePython } from './handlers/executePython'
import { authenticateTerminalUser } from '../terminal/handlers/authenticateTerminalUser'

interface RunPythonRequestBody {
  filePath?: string
  content?: string
}

const DEFAULT_RUNTIME_FILE = 'main.py'

function normalizeRelativeFilePath(filePath: string): string {
  const normalized = (filePath || '').replaceAll('\\', '/').trim()
  const pathParts = normalized
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')

  if (pathParts.length === 0) return DEFAULT_RUNTIME_FILE
  return pathParts.join('/')
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

    const relativePath = normalizeRelativeFilePath(filePath)
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'banbury-python-run-'))

    try {
      const absoluteFilePath = path.resolve(tempRoot, relativePath)
      await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true })
      await fs.writeFile(absoluteFilePath, content, 'utf8')

      const result = await executePython({
        cwd: tempRoot,
        relativeFilePath: relativePath,
      })

      res.status(200).json(result)
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run python file'
    res.status(400).json({ error: message })
  }
}
