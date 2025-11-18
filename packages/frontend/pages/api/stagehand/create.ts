import type { NextApiRequest, NextApiResponse } from 'next';
import { createStagehandSession } from './_manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { startUrl, modelName } = req.body || {};
    const created = await createStagehandSession({ startUrl, modelName });
    return res.status(200).json({ success: true, sessionId: created.id });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Failed to create Stagehand session' });
  }
}


