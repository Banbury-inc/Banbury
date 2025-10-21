import { 
  Send, 
  X, 
  Paperclip, 
  Save,
  ArrowLeft
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/old-input'
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
        
        // For new emails (not replies), automatically add signature to the body
        if (!replyTo && isContentEmpty(form.body)) {
          setForm(prev => ({ ...prev, body: cleanedSignature }))
        }
      } else {
        console.log('No signature available or error:', response)
      }
    } catch (error) {
      console.warn('Failed to fetch signature:', error)
      // Don't show error toast for signature fetch failure as it's not critical
    } finally {
      setLoadingSignature(false)
    }
  }, [isContentEmpty, cleanSignature, replyTo])

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
        // Use regular sendMessage since the signature is already visible and editable in the composer
        const attachmentsPayload = await Promise.all(attachments.map(async (file) => ({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          content: await file.arrayBuffer().then((buf) => arrayBufferToBase64(buf))
        })))
        await EmailService.sendMessage({
          to: normalizedTo,
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
    <div className="h-full flex flex-col bg-accent">
      {/* Email Form */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background hover:scrollbar-thumb-muted-foreground">
        <div className="w-full">
          {/* Recipients */}
          <div className="px-4 py-3 border-b border-border bg-background/50">
            <div className="space-y-3">
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
              </div>
              
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
            <div className="px-6 py-4 border-b border-border bg-muted/50">
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
                  // Check if signature is already in the body to prevent duplicates
                  if (signature && currentBody.includes(signature)) {
                    toast({
                      title: "Signature already present",
                      description: "The signature is already in your email.",
                      variant: "default",
                    })
                    return
                  }
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
          <div className="px-4 py-3 bg-accent border-t border-border">
            <div className="flex items-center flex-wrap gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={handleSend}
                disabled={
                  sending || parseRecipients(form.to).length === 0 || !form.subject || isContentEmpty(form.body)
                }
                className="flex-shrink-0 w-auto px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send'}
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
              {attachments.length > 0 && (
                <span className="text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-md flex-shrink-0">
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
