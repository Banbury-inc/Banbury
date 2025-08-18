import { 
  Send, 
  X, 
  Paperclip, 
  Save,
  ArrowLeft
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

import { Button } from './ui/button'
import { Input } from './ui/input'
import { useToast } from './ui/use-toast'
import { EmailService } from '../services/emailService'
import { EmailTiptapEditor } from './EmailTiptapEditor'

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
      .replace(/<br\s*\/?>/g, '<br>') // Normalize line breaks
      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
      .replace(/<p><br><\/p>/g, '<br>') // Convert empty paragraphs to line breaks
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
        // Automatically append signature to the body if it's empty or just whitespace
        if (isContentEmpty(form.body)) {
          console.log('Auto-inserting signature into empty body')
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
  }, [form.body, isContentEmpty, cleanSignature])

  const handleSend = useCallback(async () => {
    if (!form.to || !form.subject || isContentEmpty(form.body)) {
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
        await EmailService.sendReply({
          original_message_id: replyTo.messageId,
          to: form.to,
          subject: form.subject,
          body: form.body
        })
      } else {
        // Use sendMessageWithSignature for new emails to automatically include signature
        await EmailService.sendMessageWithSignature({
          to: form.to,
          subject: form.subject,
          body: form.body
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
  }, [form, onSendComplete, toast])

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
      await EmailService.sendMessage({
        to: form.to,
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
  }, [form, toast])

  const handleAttachmentChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }, [])

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-1 h-8 w-8 rounded-md transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-zinc-900 text-lg font-semibold">
            {replyTo ? 'Reply' : 'New Message'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveDraft}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-colors duration-200"
            disabled={sending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !form.to || !form.subject || isContentEmpty(form.body)}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-1.5 rounded-md transition-colors duration-200 disabled:bg-slate-300 disabled:text-slate-500"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>

      {/* Email Form */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500">
        <div className="w-full">
          {/* Recipients */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="space-y-4">
              <div>
                <label className="text-slate-700 text-sm font-medium mb-2 block">To</label>
                <Input
                  value={form.to}
                  onChange={(e) => setForm(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-white border-slate-300 text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                  placeholder="recipient@example.com"
                />
              </div>
              
              <div>
                <label className="text-slate-700 text-sm font-medium mb-2 block">Subject</label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-white border-slate-300 text-slate-900 focus:border-slate-500 focus:ring-slate-500"
                  placeholder="Subject"
                />
              </div>
            </div>
          </div>

                    {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Attachments</span>
                <span className="text-xs text-slate-500">({attachments.length})</span>
              </div>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Paperclip className="h-3 w-3 text-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-900 truncate">{file.name}</span>
                      <span className="text-xs text-slate-600">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-slate-500 hover:text-red-500 p-1 h-6 w-6 rounded-md transition-colors duration-200"
                    >
                      <X className="h-3 w-3" />
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

          {/* Attachment Button */}
          <div className="px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('attachment-input')?.click()}
                className="bg-slate-50 border-slate-300 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-700 text-slate-600 px-4 py-2 rounded-md transition-colors duration-200"
                disabled={sending}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Attach Files
              </Button>
              <input
                id="attachment-input"
                type="file"
                multiple
                onChange={handleAttachmentChange}
                className="hidden"
              />
              <span className="text-xs text-gray-500">
                {attachments.length > 0 && `${attachments.length} file(s) attached`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
