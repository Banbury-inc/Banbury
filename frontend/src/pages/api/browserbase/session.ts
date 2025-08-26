import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.BROWSERBASE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Browserbase API key not configured' });
    }

    const { startUrl, projectId } = req.body || {};

    // Create a session via Browserbase API
    const createResp = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        projectId: projectId || process.env.BROWSERBASE_PROJECT_ID,
        startUrl: startUrl || 'https://www.google.com',
        embed: true,
      }),
    });

    const data = await createResp.json();
    if (!createResp.ok) {
      return res.status(createResp.status).json({ error: data?.error || 'Failed to create Browserbase session' });
    }

    // Pass-through response; expect fields like id and viewerUrl/embedUrl
    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Unexpected error' });
  }
}


