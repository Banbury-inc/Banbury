import type { NextApiRequest, NextApiResponse } from "next";

// Extremely small in-memory thread registry; one default thread
const threads = new Map<string, { title?: string; archived?: boolean }>([["default", {}]]);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const list = Array.from(threads.keys()).map((id) => ({ status: threads.get(id)?.archived ? "archived" : "regular", remoteId: id }));
    res.status(200).json({ threads: list });
    return;
  }
  if (req.method === "POST") {
    const { action, remoteId, newTitle } = req.body || {};
    if (action === "initialize") {
      const id = remoteId || "default";
      if (!threads.has(id)) threads.set(id, {});
      res.status(200).json({ remoteId: id, externalId: undefined });
      return;
    }
    if (action === "rename" && remoteId) {
      const t = threads.get(remoteId) || {};
      t.title = newTitle;
      threads.set(remoteId, t);
      res.status(200).json({ ok: true });
      return;
    }
    if (action === "archive" && remoteId) {
      const t = threads.get(remoteId) || {};
      t.archived = true;
      threads.set(remoteId, t);
      res.status(200).json({ ok: true });
      return;
    }
    if (action === "unarchive" && remoteId) {
      const t = threads.get(remoteId) || {};
      t.archived = false;
      threads.set(remoteId, t);
      res.status(200).json({ ok: true });
      return;
    }
    if (action === "delete" && remoteId) {
      threads.delete(remoteId);
      res.status(200).json({ ok: true });
      return;
    }
    res.status(400).json({ error: "invalid action" });
    return;
  }
  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}


