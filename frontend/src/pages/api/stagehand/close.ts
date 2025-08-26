import type { NextApiRequest, NextApiResponse } from 'next';
import { closeStagehandSession } from './_manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ success: false, error: 'Missing sessionId' });
    const ok = await closeStagehandSession(sessionId);
    if (!ok) return res.status(404).json({ success: false, error: 'Session not found' });
    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Failed to close session' });
  }
}


