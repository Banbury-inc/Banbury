import type { NextApiRequest, NextApiResponse } from 'next'
import { CONFIG } from '../../../src/config/config'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end()
    return
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || ''
    const origin = `${(req.headers['x-forwarded-proto'] as string) || 'http'}://${req.headers.host}`

    const runViaLanggraphStream = async (prompt: string): Promise<string> => {
      const streamResp = await fetch(`${origin}/api/assistant/langgraph-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: [{ type: 'text', text: prompt }] }
          ],
          recursionLimit: 500
        })
      })
      console.log('streamResp', streamResp)

      if (!streamResp.ok || !streamResp.body) {
        const errText = await streamResp.text().catch(() => '')
        throw new Error(errText || 'langgraph-stream failed')
      }

      const reader = (streamResp.body as any).getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        // SSE events are separated by double newlines
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''
        for (const evt of events) {
          const line = evt.trim()
          if (!line.startsWith('data:')) continue
          const jsonStr = line.slice(5).trim()
          if (!jsonStr) continue
          try {
            const event = JSON.parse(jsonStr)
            if (event?.type === 'text-delta' && typeof event.text === 'string') {
              fullText += event.text
            }
          } catch {
            // ignore malformed event
          }
        }
      }
      return fullText.trim()
    }

    // 1) Fetch scheduled tasks for the user
    const scheduledResp = await fetch(`${CONFIG.url}/tasks/taskstudio/?status=scheduled`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (!scheduledResp.ok) {
      const err = await scheduledResp.text()
      res.status(502).json({ success: false, error: `Failed to fetch scheduled tasks: ${err}` })
      return
    }
    const scheduledData = await scheduledResp.json()
    const tasks = Array.isArray(scheduledData?.tasks) ? scheduledData.tasks : []

    const now = new Date()
    const dueTasks = tasks.filter((t: any) => t?.scheduledDate && new Date(t.scheduledDate) <= now)

    const processed: Array<{ id: string, status: string }> = []

    // 2) For each due task, run the LangGraph stream endpoint on the description and update backend
    for (const task of dueTasks) {
      const taskId = task.id
      const description: string = task.description || ''

      try {
        const resultText = await runViaLanggraphStream(description)

        // Update task as completed with result
        const updateResp = await fetch(`${CONFIG.url}/tasks/taskstudio/${encodeURIComponent(taskId)}/update/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ status: 'completed', result: resultText })
        })
        if (!updateResp.ok) throw new Error(await updateResp.text())

        // Save conversation (user prompt + assistant result)
        const title = task?.title ? `Task: ${task.title}` : 'Scheduled Task'
        const convResp = await fetch(`${CONFIG.url}/conversations/save/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            title,
            messages: [
              { role: 'user', content: [{ type: 'text', text: description }] },
              { role: 'assistant', content: [{ type: 'text', text: resultText }] }
            ],
            metadata: { taskId }
          })
        })
        // best-effort; do not throw if conversation save fails
        try { await convResp.text() } catch {}

        processed.push({ id: taskId, status: 'completed' })
      } catch (err: any) {
        // Mark task as failed with error message
        await fetch(`${CONFIG.url}/tasks/taskstudio/${encodeURIComponent(taskId)}/update/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ status: 'failed', error: String(err?.message || err) })
        })
        processed.push({ id: taskId, status: 'failed' })
      }
    }

    res.status(200).json({ success: true, count: processed.length, processed })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'internal error' })
  }
}


