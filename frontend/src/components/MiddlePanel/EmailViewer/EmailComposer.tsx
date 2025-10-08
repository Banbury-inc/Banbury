import { 
  Send, 
  X, 
  Paperclip, 
  Save,
  ArrowLeft
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { useToast } from '../../ui/use-toast'
import { EmailService } from '../../../services/emailService'
import { EmailTiptapEditor } from './EmailTiptapEditor'
import RecipientChipsInput from './RecipientChipsInput'
import { ApiService } from '../../../services/apiService'

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

interface EmailComposerProps {
  onBack?: () => void
  onSendComplete?: () => void
  replyTo?: {
    to: string
    subject: string
    body: string
    messageId?: string
  }
}

export function EmailComposer({ onBack, onSendComplete, replyTo }: EmailComposerProps) {
  const [form, setForm] = useState({
    to: replyTo?.to || '',
    subject: replyTo?.subject ? `Re: ${replyTo.subject}` : '',
    body: replyTo?.body ? `<br><br>${replyTo.body}` : ''
  })
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [signature, setSignature] = useState<string>('')
  const [loadingSignature, setLoadingSignature] = useState(false)
  const { toast } = useToast()

  // Fetch signature when component mounts (only for new emails, not replies)
  useEffect(() => {
    if (!replyTo) {
      fetchSignature()
    }
  }, [replyTo])

  // Helper function to convert HTML to plain text
  const htmlToText = useCallback((html: string): string => {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }, [])

  // Helper function to check if content is empty (ignoring HTML tags)
  const isContentEmpty = useCallback((html: string): boolean => {
    const text = htmlToText(html)
    return !text.trim()
  }, [htmlToText])

  // Helper function to clean up HTML signature
  const cleanSignature = useCallback((html: string): string => {
    // Remove excessive styling and keep essential formatting
    return html
      .replace(/style="[^"]*"/g, '') // Remove inline styles
      .replace(/class="[^"]*"/g, '') // Remove classes
      .replace(/<div[^>]*>/g, '<p>') // Convert divs to paragraphs
      .replace(/<\/div>/g, '</p>') // Close paragraphs
      .replace(/<br\s*\/>?/g, '<br>') // Normalize line breaks
      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
      .replace(/<p><br><\/p>/g, '<br>') // Convert empty paragraphs to line breaks
  }, [])

  // Helpers to support multiple recipients in the To field
  const parseRecipients = useCallback((raw: string): string[] => {
    return raw
      .split(/[;,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }, [])

  const normalizeRecipients = useCallback((raw: string): string => {
    const unique = Array.from(new Set(parseRecipients(raw)))
    return unique.join(', ')
  }, [parseRecipients])

  // Suggest contacts from recent email headers
  const loadRecipientSuggestions = useCallback(async (query: string) => {
    try {
      // Use Gmail search to fetch recent messages matching the query in from/to headers
      const q = `from:${query} OR to:${query}`
      const result = await ApiService.searchEmails(q)
      const suggestionsMap = new Map<string, { label: string; value: string }>()

      const extractAddresses = (headers: any[]) => {
        const headerMap: Record<string, string> = {}
        headers?.forEach((h) => {
          if (h && h.name && typeof h.value === 'string') headerMap[h.name.toLowerCase()] = h.value
        })
        const fields = ['from', 'to', 'cc', 'bcc']
        const values: string[] = []
        fields.forEach((f) => {
          if (headerMap[f]) values.push(headerMap[f])
        })
        return values.join(', ')
      }

      const messages: any[] = result?.messages || []
      for (const msg of messages) {
        const headers = msg?.payload?.headers || []
        const combined = extractAddresses(headers)
        if (!combined) continue
        combined.split(',').forEach((raw: string) => {
          const part = raw.trim()
          if (!part) return
          // Try to parse "Name <email>" or just email
          const match = part.match(/^(.*?)(<([^>]+)>)?$/)
          let name = ''
          let email = part
          if (match) {
            name = (match[1] || '').replace(/"/g, '').trim()
            email = (match[3] || match[1] || '').trim()
          }
          if (email && email.includes('@')) {
            const key = email.toLowerCase()
            const label = name ? `${name}` : email
            if (!suggestionsMap.has(key)) {
              suggestionsMap.set(key, { label, value: email })
            }
          }
        })
      }

      return Array.from(suggestionsMap.values()).slice(0, 20)
    } catch {
      return []
    }
  }, [])

  const fetchSignature = useCallback(async () => {
    setLoadingSignature(true)
    try {
      console.log('Fetching signature...')
      const response = await EmailService.getSignature()
      console.log('Signature response:', response)
      
      if (response.result === "success" && response.signature) {
        console.log('Setting signature:', response.signature)
        const cleanedSignature = cleanSignature(response.signature)
        setSignature(cleanedSignature)
      } else {
        console.log('No signature available or error:', response)
      }
    } catch (error) {
      console.warn('Failed to fetch signature:', error)
      // Don't show error toast for signature fetch failure as it's not critical
    } finally {
      setLoadingSignature(false)
    }
  }, [form.body, isContentEmpty, cleanSignature])

  const handleSend = useCallback(async () => {
    const normalizedTo = normalizeRecipients(form.to)
    if (!normalizedTo || !form.subject || isContentEmpty(form.body)) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (To, Subject, and Message).",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      // Use sendReply if this is a reply to an existing message
      if (replyTo?.messageId) {
        const attachmentsPayload = await Promise.all(attachments.map(async (file) => ({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          content: await file.arrayBuffer().then((buf) => arrayBufferToBase64(buf))
        })))
        await EmailService.sendReply({
          original_message_id: replyTo.messageId,
          to: normalizedTo,
          subject: form.subject,
          body: form.body,
          attachments: attachmentsPayload
        })
      } else {
        // Use sendMessageWithSignature for new emails to automatically include signature
        const attachmentsPayload = await Promise.all(attachments.map(async (file) => ({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          content: await file.arrayBuffer().then((buf) => arrayBufferToBase64(buf))
        })))
        // If the user already inserted the signature into the body, remove it before
        // calling the endpoint that appends the signature to avoid duplication.
        const bodyWithoutSignature = signature && form.body.includes(signature)
          ? form.body.replace(signature, '')
          : form.body
        await EmailService.sendMessageWithSignature({
          to: normalizedTo,
          subject: form.subject,
          body: bodyWithoutSignature,
          attachments: attachmentsPayload
        })
      }

      toast({
        title: "Email sent successfully",
        description: "",
        variant: "default",
      })

      onSendComplete?.()
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: "There was an error sending your email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }, [form, onSendComplete, toast, signature, normalizeRecipients, isContentEmpty])

  const handleSaveDraft = useCallback(async () => {
    if (!form.to && !form.subject && isContentEmpty(form.body)) {
      toast({
        title: "No content to save",
        description: "Please add some content before saving as draft.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a draft message using Gmail API
      const normalizedTo = normalizeRecipients(form.to)
      await EmailService.sendMessage({
        to: normalizedTo,
        subject: form.subject,
        body: form.body,
        isDraft: true
      })

      toast({
        title: "Draft saved",
        description: "Your draft has been saved.",
        variant: "success",
      })

      // Optionally close the composer or stay open for further editing
      // onSendComplete?.()
    } catch (error) {
      toast({
        title: "Failed to save draft",
        description: "There was an error saving your draft. Please try again.",
        variant: "destructive",
      })
    }
  }, [form, toast, normalizeRecipients, isContentEmpty])

  const handleAttachmentChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }, [])

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-800">
      {/* Email Form */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-zinc-100 dark:scrollbar-track-zinc-800 hover:scrollbar-thumb-zinc-400 dark:hover:scrollbar-thumb-zinc-500">
        <div className="w-full">
          {/* Recipients */}
          <div className="px-2 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="flex-1">
                  <RecipientChipsInput
                    value={form.to}
                    onChange={(next) => setForm(prev => ({ ...prev, to: next }))}
                    placeholder="To"
                    disabled={sending}
                    loadSuggestions={loadRecipientSuggestions}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-1">
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    variant="primaryBlack"
                    placeholder="Subject"
                    className="placeholder:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

                    {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Attachments</span>
                <span className="text-xs text-zinc-600 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-700/50 px-2 py-0.5 rounded-full">
                  {attachments.length}
                </span>
              </div>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{file.name}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-500 mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Body */}
          <div className="w-full">
            <div className="bg-white overflow-hidden">
              <EmailTiptapEditor
                value={form.body}
                onChange={(value) => setForm(prev => ({ ...prev, body: value }))}
                placeholder={loadingSignature ? "Loading your signature..." : "Write your message here..."}
                className="w-full h-96"
                disabled={sending}
                onInsertSignature={() => {
                  const currentBody = form.body
                  // If body is empty or just whitespace, replace with signature
                  // Otherwise, append signature with proper spacing
                  const newBody = isContentEmpty(currentBody)
                    ? signature 
                    : `${currentBody}<br><br>${signature}`
                  setForm(prev => ({ ...prev, body: newBody }))
                }}
                signature={signature}
                loadingSignature={loadingSignature}
              />
            </div>
          </div>

          {/* Attachment Button and Action Buttons */}
          <div className="px-2 py-2 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center flex-wrap gap-3">
              <Button
                variant="primary"
                size="xsm"
                onClick={handleSend}
                disabled={
                  sending || parseRecipients(form.to).length === 0 || !form.subject || isContentEmpty(form.body)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 w-auto px-2"
              >
                <Send className="h-4 w-10" />
                {sending ? 'Sending...' : 'Send'}
              </Button>
              <Button
                variant="primaryonWhite"
                size="xsm"
                onClick={handleSaveDraft}
                disabled={sending}
              >
                <Save className="h-4 w-10" />
              </Button>
              <Button
                variant="primaryonWhite"
                size="xsm"
                onClick={() => document.getElementById('attachment-input')?.click()}
                disabled={sending}
              >
                <Paperclip className="h-4 w-10" />
              </Button>
              <input
                id="attachment-input"
                type="file"
                multiple
                onChange={handleAttachmentChange}
                className="hidden"
              />
              {attachments.length > 0 && (
                <span className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700/50 px-3 py-1.5 rounded-md flex-shrink-0">
                  {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
