import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { NavSidebar } from '../components/nav-sidebar'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/old-input'
import { ApiService } from '../../backend/api/apiService'
import { GmailMessage, GmailMessageListResponse } from '../../backend/api/emails/emails'

export default function EmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<GmailMessageListResponse>({})
  const [selected, setSelected] = useState<GmailMessage | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) {
      router.push('/login')
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const list = await ApiService.Emails.listMessages({ maxResults: 25, labelIds: ['INBOX'] })
        setMessages(list)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const fetchMessage = async (id: string) => {
    const msg = await ApiService.Emails.getMessage(id)
    setSelected(msg)
  }

  const handleSend = async () => {
    if (!to) return
    await ApiService.Emails.sendMessage({ to, subject, body })
    setComposeOpen(false)
    setTo(''); setSubject(''); setBody('')
    const list = await ApiService.Emails.listMessages({ maxResults: 25, labelIds: ['INBOX'] })
    setMessages(list)
  }

  return (
    <div className="flex h-screen bg-black">
      <NavSidebar />
      <div className="flex-1 ml-16 flex">
        {/* List */}
        <div className="w-96 border-r border-zinc-700 overflow-y-auto">
          <div className="p-3 flex gap-2 border-b border-zinc-700">
            <Button onClick={() => setComposeOpen(true)} className="bg-zinc-800 hover:bg-zinc-700">Compose</Button>
          </div>
          {loading ? (
            <div className="p-4 text-zinc-300">Loading…</div>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {(messages.messages || []).map((m) => (
                <li key={m.id} className="p-3 hover:bg-zinc-900 cursor-pointer" onClick={() => fetchMessage(m.id)}>
                  <div className="text-white text-sm">{m.id}</div>
                  <div className="text-zinc-400 text-xs">Thread: {m.threadId}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Reader / Composer */}
        <div className="flex-1 overflow-y-auto">
          {!composeOpen && !selected && (
            <div className="h-full flex items-center justify-center text-zinc-400">Select a message</div>
          )}

          {!composeOpen && selected && (
            <div className="p-4">
              <div className="text-white font-semibold mb-2">Message {selected.id}</div>
              <pre className="text-zinc-300 whitespace-pre-wrap text-sm bg-zinc-900 p-3 rounded border border-zinc-800 overflow-x-auto">
                {JSON.stringify(selected, null, 2)}
              </pre>
            </div>
          )}

          {composeOpen && (
            <div className="p-4 max-w-2xl">
              <div className="mb-3">
                <div className="text-zinc-300 text-sm mb-1">To</div>
                <Input value={to} onChange={(e) => setTo(e.target.value)} variant="primary" />
              </div>
              <div className="mb-3">
                <div className="text-zinc-300 text-sm mb-1">Subject</div>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} variant="primary" />
              </div>
              <div className="mb-4">
                <div className="text-zinc-300 text-sm mb-1">Body</div>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className="w-full bg-black text-white border border-zinc-700 rounded p-2" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSend} className="bg-zinc-800 hover:bg-zinc-700">Send</Button>
                <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


