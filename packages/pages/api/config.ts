import { NextApiRequest, NextApiResponse } from 'next'

interface ConfigResponse {
  apiBaseUrl: string
  jupyterUrl?: string
  // Add other public config values here
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfigResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ apiBaseUrl: '' })
  }

  const config: ConfigResponse = {
    apiBaseUrl: process.env.API_BASE_URL || 'https://www.api.dev.banbury.io',
    jupyterUrl: process.env.NEXT_PUBLIC_JUPYTER_URL,
  }

  res.status(200).json(config)
}
