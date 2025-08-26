import type { NextApiRequest, NextApiResponse } from 'next';
import { getStagehandSession } from './_manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { sessionId, suggestion } = req.body || {};
    if (!sessionId || !suggestion) return res.status(400).json({ success: false, error: 'Missing sessionId or suggestion' });
    const instance = getStagehandSession(sessionId);
    if (!instance) return res.status(404).json({ success: false, error: 'Session not found' });
    await instance.page.act(suggestion);
    const title = await instance.page.title();
    const url = instance.page.url();
    return res.status(200).json({ success: true, title, url });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Failed to act' });
  }
}


