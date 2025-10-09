import * as AssistantUI from "@assistant-ui/react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRightIcon,
  ChevronUp,
  Square,
  Globe,
  Wrench,
  Mic,
  MicOff,
  File,
  FileText,
  Table,
  PaintbrushIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { ChatTiptapComposer } from "../../ChatTiptapComposer";
import { FileAttachment } from "../../file-attachment";
import { FileAttachmentDisplay } from "../../file-attachment-display";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { extractEmailContent } from "../../../utils/emailUtils";
import { FileSystemItem } from "../../../utils/fileTreeUtils";
import { ThreadScrollToBottom } from "./ThreadScrollToBottom";

import type { FC } from "react";

const {
  ComposerPrimitive,
  ThreadPrimitive,
  useComposerRuntime,
} = AssistantUI as any;

interface ComposerProps {
  attachedFiles: FileSystemItem[];
  attachedEmails: any[];
  onFileAttach: (file: FileSystemItem) => void;
  onFileRemove: (fileId: string) => void;
  onEmailAttach: (email: any) => void;
  onEmailRemove: (emailId: string) => void;
  userInfo: {
    username: string;
    email?: string;
  } | null;
  isWebSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  toolPreferences: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean; browser: boolean; x_api: boolean };
  onUpdateToolPreferences: (prefs: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean; browser: boolean; x_api: boolean }) => void;
  attachmentPayloads: Record<string, { fileData: string; mimeType: string }>;
  onAttachmentPayload: (fileId: string, payload: { fileData: string; mimeType: string }) => void;
  onSend?: () => void;
  onFileView?: (file: FileSystemItem) => void;
  pendingChanges: Array<{ id: string; type: string; description: string }>;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export const Composer: FC<ComposerProps> = ({ attachedFiles, attachedEmails, onFileAttach, onFileRemove, onEmailAttach, onEmailRemove, userInfo, isWebSearchEnabled, onToggleWebSearch, toolPreferences, onUpdateToolPreferences, attachmentPayloads, onAttachmentPayload, onSend, onFileView, pendingChanges, onAcceptAll, onRejectAll }) => {
  const composer = useComposerRuntime();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isPendingChangesExpanded, setIsPendingChangesExpanded] = useState(false);

  // Add attachments to the composer when files or emails are attached
  useEffect(() => {
    if (!composer.attachments) return;
    
    // Clear existing attachments first
    composer.attachments.clear();
    
    // Add file attachments
    attachedFiles.forEach((file) => {
      composer.attachments.add({
        type: "file",
        id: file.file_id!,
        name: file.name,
        content: [
          {
            type: "file-attachment",
            fileId: file.file_id!,
            fileName: file.name,
            filePath: file.path,
            ...(file.file_id && attachmentPayloads[file.file_id]
              ? { fileData: attachmentPayloads[file.file_id].fileData, mimeType: attachmentPayloads[file.file_id].mimeType }
              : {}),
          }
        ]
      });
    });
    
    // Add email attachments
    attachedEmails.forEach((email) => {
      const subject = email.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
      const from = email.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
      
      composer.attachments.add({
        type: "email",
        id: email.id,
        name: `Email: ${subject}`,
        content: [
          {
            type: "email-attachment",
            emailId: email.id,
            subject: subject,
            from: from,
            snippet: email.snippet || '',
            threadId: email.threadId,
            internalDate: email.internalDate,
            payload: email.payload
          }
        ]
      });
    });
  }, [attachedFiles, attachedEmails, composer.attachments, attachmentPayloads]);

  const handleSend = () => {
    // Get the text directly from the Tiptap editor, including mentions
    const proseMirrorElements = document.querySelectorAll('.ProseMirror');
    
    // Find the chat composer's ProseMirror element (should be inside .bg-zinc-800)
    let proseMirrorElement = null;
    let text = '';
    
    for (const element of Array.from(proseMirrorElements)) {
      const isInChatComposer = element.closest('.bg-zinc-800') || element.closest('.min-h-16');
      
      if (isInChatComposer) {
        proseMirrorElement = element;
        text = element.textContent || '';
        break;
      }
    }
    
    // If we still don't have text, try the hidden input
    if (!text.trim()) {
      const input = document.querySelector('textarea[aria-label="Message input"]') as HTMLTextAreaElement;
      text = input?.value || '';
    }
    
    // CRITICAL: Set document context with email content BEFORE any composer.send() call
    try {
      // Get existing document content (docx, etc)
      const documentContent = '';
      try {
        const documentEditors = Array.from(document.querySelectorAll('.ProseMirror[contenteditable="true"]'));
        for (const element of documentEditors) {
          // Skip if it's the current chat editor
          const isInChatComposer = element.closest('.bg-zinc-800') || element.closest('.min-h-16');
          if (isInChatComposer) continue;
          
          // Check various document editor indicators
          const hasSimpleTiptapClass = element.classList.contains('simple-tiptap-editor') || 
                                       element.closest('.simple-tiptap-editor');
          const isInAITiptap = element.closest('.min-h-\\[600px\\]') || 
                              element.closest('.bg-card');
          const isInWordViewer = element.closest('[class*="MuiBox"]') || 
                                element.closest('.h-full.border-0.rounded-none');
          
          if (hasSimpleTiptapClass || isInAITiptap || isInWordViewer) {
            const content = element.textContent || '';
            if (content.trim() && content.length > 20) {
              break; // Found document content
            }
          }
        }
      } catch {}
      
      // Get and merge email content
      const emailsRaw = localStorage.getItem('pendingEmailAttachments');
      console.log('[Composer.tsx] DEBUG - BEFORE SEND - emailsRaw:', emailsRaw);
      const emails = emailsRaw ? JSON.parse(emailsRaw) : [];
      const emailSections: string[] = [];
      if (Array.isArray(emails)) {
        emails.forEach((e: any) => {
          const subject = e?.subject || 'No Subject';
          const from = e?.from || '';
          const dateStr = e?.date || '';
          let body = '';
          try {
            if (e?.payload) {
              const content = extractEmailContent(e.payload);
              const raw = (content?.text || content?.html || e?.snippet || '').toString();
              body = raw.length > 20000 ? raw.slice(0, 20000) + '\n...[truncated]...' : raw;
            } else {
              const raw = (e?.preview || e?.snippet || '').toString();
              body = raw.length > 20000 ? raw.slice(0, 20000) + '\n...[truncated]...' : raw;
            }
          } catch {}
          emailSections.push([
            `Subject: ${subject}`,
            from ? `From: ${from}` : '',
            dateStr ? `Date: ${dateStr}` : '',
            'Body:',
            body
          ].filter(Boolean).join('\n'));
        });
      }

      const emailDocBlock = emailSections.length > 0
        ? ['Current email content:', ...emailSections].join('\n\n---\n\n')
        : '';

      const combinedContext = [documentContent, emailDocBlock].filter(Boolean).join('\n\n');
      if (combinedContext) {
        localStorage.setItem('pendingDocumentContext', combinedContext);
        console.log('[Composer.tsx] DEBUG - BEFORE SEND - SET pendingDocumentContext to:', combinedContext.slice(0, 200));
      } else {
        localStorage.removeItem('pendingDocumentContext');
        console.log('[Composer.tsx] DEBUG - BEFORE SEND - REMOVED pendingDocumentContext');
      }
    } catch (error) {
      console.error('[Composer.tsx] DEBUG - Error in email merge:', error);
    }
      
    if (text.trim().length > 0) {
      // Try multiple approaches to get the text into the composer
      const input = document.querySelector('textarea[aria-label="Message input"]') as HTMLTextAreaElement;
      if (input) {
        // Set the input value and trigger all possible events
        input.value = text; // Keep only the user's message visible
        input.focus();
        
        // Trigger all possible events to ensure detection
        ['input', 'change', 'keyup', 'keydown', 'focus', 'blur'].forEach(eventType => {
          input.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
        
        // Use the composer's setText method with just the chat text (hidden context is provided separately)
        try {
          if (composer && typeof composer.setText === 'function') {
            composer.setText(text);
          }
        } catch (e) {
          console.error('Error setting composer text:', e);
        }
        
        // Wait and then send
        setTimeout(() => {
          composer.send();
          
          // Call the onSend callback if provided
          if (onSend) {
            onSend();
          }
          
          // Clear after sending
          setTimeout(() => {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            if (proseMirrorElement) {
              proseMirrorElement.innerHTML = '<p></p>';
            }
          }, 100);
        }, 50); // Reduced delay since context is already set
      }
    }
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)] pb-4 md:pb-6" style={{ backgroundColor: 'transparent' }}>
      <ThreadScrollToBottom />

      <div className="relative flex w-full flex-col">
        {/* Display attachments (files + emails) above the composer */}
        {(attachedFiles.length > 0 || attachedEmails.length > 0) && (
          <div className="bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 rounded-t-2xl px-2 py-0.5">
            <FileAttachmentDisplay 
              files={attachedFiles}
              emails={attachedEmails}
              onFileClick={(file) => onFileRemove(file.file_id!)}
              onEmailClick={(emailId) => onEmailRemove(emailId)}
              onFileView={onFileView}
            />
          </div>
        )}

        {/* Global Accept/Reject Bar */}
        {pendingChanges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="w-full"
          >
            <div className="bg-zinc-200 dark:bg-zinc-800 backdrop-blur-sm border-b border-zinc-300 dark:border-zinc-700 px-2 py-2">
              <div className="space-y-1">
                {/* Dropdown header */}
                <div className="flex items-center justify-between gap-2">
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 p-1 rounded flex-1"
                    onClick={() => setIsPendingChangesExpanded(!isPendingChangesExpanded)}
                  >
                    {isPendingChangesExpanded ? (
                      <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    )}
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                      {pendingChanges.length} File{pendingChanges.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={onRejectAll}
                      className="text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 h-7 text-xs px-2 mr-2"
                    >
                      Reject all
                    </Button>
                    <Button
                      size="sm"
                      onClick={onAcceptAll}
                      className="bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border-0 h-7 text-xs px-2"
                    >
                      Accept all
                    </Button>
                  </div>
                </div>

                {/* File list */}
                {isPendingChangesExpanded && (
                  <div className="ml-6 space-y-1">
                    {pendingChanges.map((change) => {
                      const getIcon = () => {
                        switch (change.type) {
                          case 'document':
                            return <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />;
                          case 'spreadsheet':
                            return <Table className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />;
                          case 'canvas':
                            return <PaintbrushIcon className="h-4 w-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />;
                          default:
                            return <File className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />;
                        }
                      };

                      return (
                        <div
                          key={change.id}
                          className="flex items-center gap-2 py-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
                        >
                          {getIcon()}
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1" title={change.description}>
                            {change.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <ComposerPrimitive.Root className="relative flex w-full flex-col rounded-2xl">
          {/* Hidden native input to keep @assistant-ui runtime in sync */}
          <ComposerPrimitive.Input
            placeholder="Send a message..."
            className="absolute opacity-0 pointer-events-none w-full h-full"
            rows={1}
            aria-label="Message input"
            ref={inputRef as any}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Visible Tiptap editor with @ mention for files */}
          <div className={`bg-accent border-0 ${(attachedFiles.length > 0 || attachedEmails.length > 0 || pendingChanges.length > 0) ? 'border-t-0 rounded-t-none' : 'border-t border-zinc-300 dark:border-zinc-700 rounded-t-2xl'}`}>
            <ChatTiptapComposer
              hiddenInputRef={inputRef}
              userInfo={userInfo}
              onFileAttach={onFileAttach}
              onAttachmentPayload={onAttachmentPayload}
              placeholder="Send a message..."
              className="min-h-16"
              onSend={handleSend}
            />
          </div>

          <ComposerAction 
            attachedFiles={attachedFiles}
            attachedEmails={attachedEmails}
            onFileAttach={onFileAttach}
            onFileRemove={onFileRemove}
            onEmailAttach={onEmailAttach}
            onEmailRemove={onEmailRemove}
            userInfo={userInfo}
            isWebSearchEnabled={isWebSearchEnabled}
            onToggleWebSearch={onToggleWebSearch}
            toolPreferences={toolPreferences}
            onUpdateToolPreferences={(prefs) => onUpdateToolPreferences(prefs)}
            onSend={handleSend}
          />
        </ComposerPrimitive.Root>
      </div>
    </div>
  );
};

interface ComposerActionProps {
  attachedFiles: FileSystemItem[];
  attachedEmails: any[];
  onFileAttach: (file: FileSystemItem) => void;
  onFileRemove: (fileId: string) => void;
  onEmailAttach: (email: any) => void;
  onEmailRemove: (emailId: string) => void;
  userInfo: {
    username: string;
    email?: string;
  } | null;
  isWebSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  toolPreferences: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean; browser: boolean; x_api: boolean };
  onUpdateToolPreferences: (prefs: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean; browser: boolean; x_api: boolean }) => void;
  onSend: () => void;
}

const ComposerAction: FC<ComposerActionProps> = ({ attachedFiles, attachedEmails, onFileAttach, onFileRemove, onEmailAttach, onEmailRemove, userInfo, isWebSearchEnabled, onToggleWebSearch, toolPreferences, onUpdateToolPreferences, onSend }) => {
  const composer = useComposerRuntime();
  const [hasText, setHasText] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const getRecognition = () => {
    const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return null;
    if (!recognitionRef.current) {
      const rec = new SpeechRecognitionImpl();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      recognitionRef.current = rec;
    }
    return recognitionRef.current;
  };

  const startRecording = () => {
    const rec = getRecognition();
    if (!rec) return;
    let finalTranscript = '';
    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      const text = (finalTranscript || interim).trim();
      const input = document.querySelector('textarea[aria-label="Message input"]') as HTMLTextAreaElement | null;
      if (input) {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      try {
        window.dispatchEvent(new CustomEvent('composer-set-text', { detail: { text } }));
      } catch {}
      setHasText(Boolean(text.length));
    };
    rec.onend = () => {
      setIsRecording(false);
    };
    rec.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch {}
    }
    setIsRecording(false);
  };

  // Check for text content in the hidden input
  useEffect(() => {
    const checkForText = () => {
      const input = document.querySelector('textarea[aria-label="Message input"]') as HTMLTextAreaElement;
      if (input) {
        const text = input.value.trim();
        setHasText(text.length > 0);
      }
    };

    // Listen for custom tiptap update events
    const handleTiptapUpdate = (event: CustomEvent) => {
      const text = event.detail?.text || '';
      setHasText(text.trim().length > 0);
    };

    // Check immediately
    checkForText();

    // Set up an interval to check for changes
    const interval = setInterval(checkForText, 50); // Check more frequently

    // Listen for tiptap update events
    document.addEventListener('tiptap-update', handleTiptapUpdate as EventListener);

    return () => {
      clearInterval(interval);
      document.removeEventListener('tiptap-update', handleTiptapUpdate as EventListener);
    };
  }, []);

  const handleSendFromButton = () => {
    // Simply call the onSend function which handles document context
    onSend();
  };

  return (
    <div className="bg-zinc-200 dark:bg-zinc-800 border-0 relative flex items-center justify-between rounded-b-2xl p-2">
      <div className="flex pl-4 items-center gap-2">
        <FileAttachment
          onFileAttach={onFileAttach}
          attachedFiles={[]}
          onFileRemove={onFileRemove}
          userInfo={userInfo}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="primary"
              size="icon"
              className="h-8 w-8"
              title="Tools"
              aria-label="Tools"
            >
              <Wrench height={16} width={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>
              Tools
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={toolPreferences.web_search}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, web_search: Boolean(checked) })}
            >
              <div className="flex flex-col">
                <span>Web Search</span>
                <span className="text-xs text-muted-foreground">Enhanced with content enrichment</span>
              </div>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={toolPreferences.read_file}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, read_file: Boolean(checked) })}
            >
              <div className="flex flex-col">
                <span>Read File</span>
                <span className="text-xs text-muted-foreground">Advanced file processing</span>
              </div>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={toolPreferences.gmail}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, gmail: Boolean(checked) })}
            >
              <div className="flex flex-col">
                <span>Gmail Integration</span>
                <span className="text-xs text-muted-foreground">Read, search, and send emails</span>
              </div>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={toolPreferences.browser}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, browser: Boolean(checked) })}
            >
              <div className="flex flex-col">
                <span>Browser</span>
                <span className="text-xs text-muted-foreground">Automated browser sessions</span>
              </div>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={toolPreferences.x_api}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, x_api: Boolean(checked) })}
            >
              <div className="flex flex-col">
                <span>X (Twitter)</span>
                <span className="text-xs text-muted-foreground">Enable X API tools</span>
              </div>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked disabled>
              <div className="flex flex-col">
                <span>Memory</span>
                <span className="text-xs text-muted-foreground">Always enabled</span>
              </div>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="primary"
          size="icon"
          className={`h-8 w-8 ${
            isRecording
              ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
              : ""
          }`}
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? "Stop recording" : "Start voice input"}
          aria-label={isRecording ? "Stop recording" : "Start voice input"}
          disabled={!(typeof window !== 'undefined' && (((window as any).SpeechRecognition) || ((window as any).webkitSpeechRecognition)))}
        >
          {isRecording ? <MicOff height={16} width={16} /> : <Mic height={16} width={16} />}
        </Button>
        <Button
          variant="primary"
          size="icon"
          className={`h-8 w-8 ${
            isWebSearchEnabled 
              ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" 
              : ""
          }`}
          onClick={onToggleWebSearch}
          title={isWebSearchEnabled ? "Disable web search" : "Enable web search"}
          aria-label={isWebSearchEnabled ? "Disable web search" : "Enable web search"}
        >
          <Globe height={16} width={16} />
        </Button>
      </div>

      <ThreadPrimitive.If running={false}>
        <Button
          type="button"
          variant="primary"
          size="icon"
          className={`${
            hasText 
              ? 'cursor-pointer bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100' 
              : 'opacity-50 bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
          }`}
          title="Send"
          aria-label="Send message"
          onClick={handleSendFromButton}
          disabled={!hasText}
        >
          <ChevronRightIcon height={16} width={16} />
        </Button>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="primary"
            size="icon"
            title="Stop generating"
            aria-label="Stop generating"
          >
            <Square height={16} width={16} />
          </Button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
  );
};

