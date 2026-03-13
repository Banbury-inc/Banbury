import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticateTerminalUser, extractBearerToken } from './handlers/authenticateTerminalUser'
import { syncS3RuntimeTree } from './handlers/syncS3RuntimeTree'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    await authenticateTerminalUser(req)
    const authToken = extractBearerToken(req)
    if (!authToken) {
      res.status(401).json({ error: 'Missing authorization token' })
      return
    }

    const result = await syncS3RuntimeTree(authToken)
    res.status(200).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync S3 files'
    res.status(400).json({ error: message })
  }
}
