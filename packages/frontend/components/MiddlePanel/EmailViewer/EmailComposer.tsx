import {
  Send,
  X,
  Paperclip,
  Save,
} from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '../../common/ui/button'
import { Input } from '../../common/ui/old-input'
import { useToast } from '../../common/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../common/ui/dialog'
import { EmailTiptapEditor } from './EmailTiptapEditor'
import RecipientChipsInput from './RecipientChipsInput'
import { ApiService } from '../../../../backend/api/apiService'
import { useKeyboardShortcuts, getSendShortcutText } from './handlers/useKeyboardShortcuts'
import { arrayBufferToBase64 } from '../../../utils/emailUtils'

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25MB

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
    cc: '',
    bcc: '',
    subject: replyTo?.subject ? `Re: ${replyTo.subject}` : '',
    body: replyTo?.body ? `<br><br>${replyTo.body}` : ''
  })
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [signature, setSignature] = useState<string>('')
  const [loadingSignature, setLoadingSignature] = useState(false)
  const { toast } = useToast()
  const sendShortcutText = getSendShortcutText()

  // Ref to track form.body without causing fetchSignature to re-create on every keystroke
  const formBodyRef = useRef(form.body)
  useEffect(() => {
    formBodyRef.current = form.body
  }, [form.body])

  // Fetch signature when component mounts (only for new emails, not replies)
  useEffect(() => {
    if (!replyTo) {
      fetchSignature()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return html
      .replace(/style="[^"]*"/g, '')
      .replace(/class="[^"]*"/g, '')
      .replace(/<div[^>]*>/g, '<p>')
      .replace(/<\/div>/g, '</p>')
      .replace(/<br\s*\/>?/g, '<br>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br><\/p>/g, '<br>')
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
      const q = `from:${query} OR to:${query}`
      const result = await ApiService.Emails.searchEmails(q)
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
      const response = await ApiService.Emails.getSignature()

      if (response.result === "success" && response.signature) {
        const cleanedSignature = cleanSignature(response.signature)
        setSignature(cleanedSignature)

        // Read body from ref to avoid stale closure
        if (!replyTo && isContentEmpty(formBodyRef.current)) {
          setForm(prev => ({ ...prev, body: cleanedSignature }))
        }
      }
    } catch (error) {
      console.warn('Failed to fetch signature:', error)
    } finally {
      setLoadingSignature(false)
    }
  }, [isContentEmpty, cleanSignature, replyTo])

  const handleSend = useCallback(async () => {
    const normalizedTo = normalizeRecipients(form.to)
    if (!normalizedTo || isContentEmpty(form.body)) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (To and Message).",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const attachmentsPayload = await Promise.all(attachments.map(async (file) => ({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        content: await file.arrayBuffer().then((buf) => arrayBufferToBase64(buf))
      })))

      if (replyTo?.messageId) {
        await ApiService.Emails.sendReply({
          original_message_id: replyTo.messageId,
          to: normalizedTo,
          subject: form.subject,
          body: form.body,
          attachments: attachmentsPayload
        })
      } else {
        await ApiService.Emails.sendMessage({
          to: normalizedTo,
          cc: normalizeRecipients(form.cc) || undefined,
          bcc: normalizeRecipients(form.bcc) || undefined,
          subject: form.subject,
          body: form.body,
          attachments: attachmentsPayload
        })
      }

      toast({
        title: "Email sent successfully",
        description: "",
        variant: "default",
      })

      onSendComplete?.()
    } catch {
      toast({
        title: "Failed to send email",
        description: "There was an error sending your email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }, [form, onSendComplete, toast, attachments, normalizeRecipients, isContentEmpty, replyTo])

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
      const normalizedTo = normalizeRecipients(form.to)
      await ApiService.Emails.sendMessage({
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
    } catch {
      toast({
        title: "Failed to save draft",
        description: "There was an error saving your draft. Please try again.",
        variant: "destructive",
      })
    }
  }, [form, toast, normalizeRecipients, isContentEmpty])

  const handleAttachmentChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const oversized = files.filter(f => f.size > MAX_ATTACHMENT_SIZE)
    if (oversized.length > 0) {
      oversized.forEach(f => {
        toast({
          title: "File too large",
          description: `"${f.name}" exceeds the 25MB attachment limit.`,
          variant: "destructive",
        })
      })
    }
    const valid = files.filter(f => f.size <= MAX_ATTACHMENT_SIZE)
    if (valid.length > 0) setAttachments(prev => [...prev, ...valid])
    event.target.value = ''
  }, [toast])

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleDiscard = useCallback(() => {
    const hasContent = form.to || form.subject || !isContentEmpty(form.body)
    if (hasContent) {
      setShowDiscardDialog(true)
    } else {
      onBack?.()
    }
  }, [form.to, form.subject, form.body, isContentEmpty, onBack])

  // Enable keyboard shortcut (Ctrl+Enter / Cmd+Enter) when form is valid and not sending
  const canSend = parseRecipients(form.to).length > 0 && !isContentEmpty(form.body) && !sending
  useKeyboardShortcuts({
    onSend: handleSend,
    enabled: canSend
  })

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header with discard button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <span className="text-sm font-medium text-foreground">
          {replyTo ? 'Reply' : 'New Message'}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDiscard}
          disabled={sending}
          title="Discard"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Email Form */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background hover:scrollbar-thumb-muted-foreground">
        <div className="w-full">
          {/* Recipients */}
          <div className="px-4 py-3 border-b border-border bg-background/50">
            <div className="space-y-3">
              {/* To */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground min-w-[60px]">To:</span>
                <div className="flex-1">
                  <RecipientChipsInput
                    value={form.to}
                    onChange={(next) => setForm(prev => ({ ...prev, to: next }))}
                    placeholder="Add recipients"
                    disabled={sending}
                    loadSuggestions={loadRecipientSuggestions}
                  />
                </div>
                {(!showCc || !showBcc) && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!showCc && (
                      <button
                        type="button"
                        onClick={() => setShowCc(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                      >
                        CC
                      </button>
                    )}
                    {!showBcc && (
                      <button
                        type="button"
                        onClick={() => setShowBcc(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                      >
                        BCC
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* CC */}
              {showCc && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground min-w-[60px]">CC:</span>
                  <div className="flex-1">
                    <RecipientChipsInput
                      value={form.cc}
                      onChange={(next) => setForm(prev => ({ ...prev, cc: next }))}
                      placeholder="Add CC recipients"
                      disabled={sending}
                      loadSuggestions={loadRecipientSuggestions}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowCc(false); setForm(prev => ({ ...prev, cc: '' })) }}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    aria-label="Remove CC"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* BCC */}
              {showBcc && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground min-w-[60px]">BCC:</span>
                  <div className="flex-1">
                    <RecipientChipsInput
                      value={form.bcc}
                      onChange={(next) => setForm(prev => ({ ...prev, bcc: next }))}
                      placeholder="Add BCC recipients"
                      disabled={sending}
                      loadSuggestions={loadRecipientSuggestions}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowBcc(false); setForm(prev => ({ ...prev, bcc: '' })) }}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    aria-label="Remove BCC"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Subject */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground min-w-[60px]">Subject:</span>
                <div className="flex-1">
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Add subject"
                    className="bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Attachments</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {attachments.length}
                </span>
              </div>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-background hover:bg-accent rounded-lg border border-border hover:border-border/80 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Paperclip className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
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
            <div className="bg-background overflow-hidden">
              <EmailTiptapEditor
                value={form.body}
                onChange={(value) => setForm(prev => ({ ...prev, body: value }))}
                placeholder={loadingSignature ? "Loading your signature..." : "Write your message here..."}
                className="w-full h-96"
                disabled={sending}
                onInsertSignature={() => {
                  const currentBody = form.body
                  if (signature && currentBody.includes(signature)) {
                    toast({
                      title: "Signature already present",
                      description: "The signature is already in your email.",
                      variant: "default",
                    })
                    return
                  }
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

          {/* Action Buttons */}
          <div className="px-4 py-3 bg-card border-t border-border">
            <div className="flex items-center flex-wrap gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={handleSend}
                disabled={!canSend}
                className="flex-shrink-0 w-auto px-4"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send'}
                <span className="ml-2 text-xs opacity-70">{sendShortcutText}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={sending}
                className="bg-background/80 hover:bg-background border-border"
              >
                <Save className="h-4 w-4 mr-2" />
                Save draft
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById('attachment-input')?.click()}
                disabled={sending}
                className="bg-background/80 hover:bg-background border-border"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Attach
              </Button>
              <input
                id="attachment-input"
                type="file"
                multiple
                onChange={handleAttachmentChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Discard confirmation dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard message?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your message will be lost. Save as draft to continue later.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDiscardDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDiscardDialog(false)
                handleSaveDraft()
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save draft
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDiscardDialog(false)
                onBack?.()
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
