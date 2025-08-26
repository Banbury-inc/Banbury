import type { NextApiRequest, NextApiResponse } from 'next';
import { getStagehandSession } from './_manager';
import { z } from 'zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { sessionId, instruction, schema } = req.body || {};
    if (!sessionId || !instruction || !schema) return res.status(400).json({ success: false, error: 'Missing sessionId, instruction, or schema' });
    const instance = getStagehandSession(sessionId);
    if (!instance) return res.status(404).json({ success: false, error: 'Session not found' });
    // Build a zod schema from a basic JSON descriptor
    const built = z.object(Object.fromEntries(Object.entries(schema || {}).map(([k, v]) => [k, z.string()] as const)) as Record<string, z.ZodTypeAny>);
    const result = await instance.page.extract({ instruction, schema: built });
    return res.status(200).json({ success: true, result });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Failed to extract' });
  }
}


