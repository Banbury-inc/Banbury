import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as AssistantUI from "@assistant-ui/react";
import {
  ChevronRightIcon,
  Square,
  Wrench,
  Mic,
  MicOff,
  ChevronDown,
  Plus,
  Paperclip,
  Image,
  Video,
  Upload,
  ClipboardList,
  Infinity,
  CornerDownLeft,
  Search,
  X,
} from "lucide-react";

import { ChatTiptapComposer } from "../../ChatTiptapComposer";
import { FileAttachmentPicker } from "./components/file-attachment-picker";
import { FileAttachmentDisplay } from "./components/file-attachment-display";
import { QueuedMessagesDisplay, type QueuedMessage } from "./components/queued-messages-display";
import { PendingChangesBar } from "./components/pending-changes-bar";
import { ContextWheel } from "./components/context-wheel";
import { Button } from "../../ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../../ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover";
import { Check } from "lucide-react";
import { FileSystemItem } from "../../../utils/fileTreeUtils";
import { ThreadScrollToBottom } from "./ThreadScrollToBottom";
import { handleSend } from "./handlers/handleSend";
import { createComposerSendEventListener } from "./handlers/handleComposerSendEvent";
import { computeContextBudget } from "./handlers/contextBudget";
import { getDocumentContextPreview } from "../../../assistant/ClaudeRuntimeProvider/handlers/getDocumentContextPreview";
import {
  getModelDisplayName,
  AVAILABLE_MODELS,
  getModelById,
  getDefaultModelForProvider,
  DEFAULT_VISIBLE_MODELS,
} from "./handlers/getModelDisplayName";
import { toolConfigs } from "./handlers/toolConfig";
import {
  toggleToolPreference,
  setImageGenerationModel,
  setVideoGenerationModel,
  IMAGE_GENERATION_MODELS,
  VIDEO_GENERATION_MODELS
} from "./handlers/composer-plus-menu-handlers";
import { handleLocalFileUpload } from "../../handlers/handle-local-file-upload";
import { checkIsRunning } from "./handlers/messageQueue";

import type { FC } from "react";
import { Typography } from "frontend/components/ui/typography";

const {
  ComposerPrimitive,
  ThreadPrimitive,
  useComposerRuntime,
  useThreadRuntime,
} = AssistantUI as any;

export interface ComposerToolPreferences {
  web_search: boolean;
  tiptap_ai: boolean;
  read_file: boolean;
  gmail: boolean;
  langgraph_mode: boolean;
  browser: boolean;
  x_api: boolean;
  slack: boolean;
  // Document editing tools
  sheet_ai: boolean;
  docx_ai: boolean;
  pptx_ai: boolean;
  tldraw_ai: boolean;
  document_ai: boolean;
  // File management tools
  create_file: boolean;
  create_folder: boolean;
  download_from_url: boolean;
  search_files: boolean;
  // Calendar tools
  calendar: boolean;
  msCalendar: boolean;
  // Development tools
  github: boolean;
  // Media tools
  generate_image: boolean;
  generate_video: boolean;
  // System tools
  memory: boolean;
  // Agent modes
  plan_mode: boolean;
  ask_mode: boolean;
  model_provider: "anthropic" | "openai" | "google";
  model_id?: string;
  image_generation_model?: string;
  video_generation_model?: string;
  visibleModels?: string[];
}

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
  toolPreferences: ComposerToolPreferences;
  onUpdateToolPreferences: (prefs: ComposerToolPreferences) => void;
  attachmentPayloads: Record<string, { fileData: string; mimeType: string }>;
  onAttachmentPayload: (fileId: string, payload: { fileData: string; mimeType: string }) => void;
  onSend?: () => void;
  onFileView?: (file: FileSystemItem) => void;
  pendingChanges: Array<{ id: string; type: string; description: string }>;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  // Fallback message buffer for context calculation when runtime messages aren't available
  messageBuffer?: any[] | null;
  // Tab ID for updating tab title on first message
  assistantTabId?: string;
  // Message queue props
  queuedMessages: QueuedMessage[];
  onQueueMessage: (text: string) => void;
  onRemoveQueuedMessage: (id: string) => void;
  onMoveQueuedMessageToFront: (id: string) => void;
  onSendNextQueued: () => void;
}

export const Composer: FC<ComposerProps> = ({ attachedFiles, attachedEmails, onFileAttach, onFileRemove, onEmailAttach, onEmailRemove, userInfo, toolPreferences, onUpdateToolPreferences, attachmentPayloads, onAttachmentPayload, onSend, onFileView, pendingChanges, onAcceptAll, onRejectAll, messageBuffer, assistantTabId, queuedMessages, onQueueMessage, onRemoveQueuedMessage, onMoveQueuedMessageToFront, onSendNextQueued }) => {
  const composer = useComposerRuntime();
  const threadRuntime = useThreadRuntime();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const composerContainerRef = useRef<HTMLDivElement | null>(null);
  const proseMirrorRef = useRef<HTMLElement | null>(null);
  const sendButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isEditingQueuedMessage, setIsEditingQueuedMessage] = useState(false);

  // Check if agent is currently running
  const isRunning = checkIsRunning(threadRuntime);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachedFiles, attachedEmails, attachmentPayloads]);

  // Listen for assistant-composer-send events to programmatically send messages
  useEffect(() => {
    const handler = createComposerSendEventListener({
      composer,
      assistantTabId,
      inputRef,
      onSend: () => {
        setIsEditingQueuedMessage(false)
        if (onSend) onSend()
      },
      sendButtonRef,
    })

    window.addEventListener("assistant-composer-send", handler)
    return () => {
      window.removeEventListener("assistant-composer-send", handler)
    }
  }, [composer, assistantTabId, onSend])

  // Clear editing state when composer is cleared
  useEffect(() => {
    const handleClear = () => {
      setIsEditingQueuedMessage(false)
    }
    window.addEventListener('composer-clear', handleClear)
    return () => {
      window.removeEventListener('composer-clear', handleClear)
    }
  }, [])

  // Handler for editing a queued message
  const handleEditQueuedMessage = useCallback((id: string) => {
    const message = queuedMessages.find(msg => msg.id === id)
    if (!message) return
    
    // Set editing state
    setIsEditingQueuedMessage(true)
    
    // Set the message text in the composer input
    if (inputRef.current) {
      inputRef.current.value = message.text
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
      inputRef.current.focus()
    }
    
    // Also update the tiptap editor
    const proseMirror = proseMirrorRef.current
    if (proseMirror) {
      window.dispatchEvent(new CustomEvent('composer-set-text', { detail: { text: message.text } }))
    }
    
    // Remove the queued message since we're editing it
    onRemoveQueuedMessage(id)
  }, [queuedMessages, onRemoveQueuedMessage])

  // Handler for sending a queued message now
  const handleSendQueuedMessageNow = useCallback((id: string) => {
    const message = queuedMessages.find(msg => msg.id === id)
    if (!message) return
    
    // Remove the message from queue
    onRemoveQueuedMessage(id)
    
    // Cancel current run if running
    try {
      threadRuntime?.cancelRun?.()
    } catch {}
    
    // Send the message immediately
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('assistant-composer-send', {
        detail: { tabId: assistantTabId, text: message.text }
      }))
    }, 100)
  }, [queuedMessages, onRemoveQueuedMessage, threadRuntime, assistantTabId])

  // Handler for canceling editing a queued message
  const handleCancelEditQueuedMessage = useCallback(() => {
    setIsEditingQueuedMessage(false)
    // Clear the composer
    window.dispatchEvent(new CustomEvent('composer-clear'))
  }, [])

  // Handle Escape key to cancel editing queued message
  useEffect(() => {
    if (!isEditingQueuedMessage) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleCancelEditQueuedMessage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEditingQueuedMessage, handleCancelEditQueuedMessage])

  return (
    <div className="relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)] pb-4 md:pb-6" style={{ backgroundColor: 'transparent' }}>
      <ThreadScrollToBottom />

      <div ref={composerContainerRef} className="relative flex w-full flex-col">
        {/* Display queued messages above attachments */}
        {queuedMessages.length > 0 && (
          <div className="bg-accent border-b border-border rounded-t-md px-2 py-0.5 w-[97%] mx-auto">
            <QueuedMessagesDisplay 
              messages={queuedMessages}
              onRemove={onRemoveQueuedMessage}
              onMoveToFront={onMoveQueuedMessageToFront}
              onEdit={handleEditQueuedMessage}
              onSendNow={handleSendQueuedMessageNow}
            />
          </div>
        )}

        {/* Display attachments (files + emails) above the composer */}
        {(attachedFiles.length > 0 || attachedEmails.length > 0) && (
          <div className={`bg-accent border-b border-border ${queuedMessages.length === 0 ? 'rounded-t-md' : ''} px-2 py-0.5 w-[97%] mx-auto`}>
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
        <PendingChangesBar
          pendingChanges={pendingChanges}
          onAcceptAll={onAcceptAll}
          onRejectAll={onRejectAll}
        />

        {/* Display editing queued message indicator */}
        {isEditingQueuedMessage && (
          <div className="bg-accent border-b border-border rounded-t-md px-2 py-1 flex items-center justify-between w-full">
            <Typography variant="xs" className="text-zinc-700 dark:text-zinc-300 font-medium">
              editing queued message
            </Typography>
            <Button
              variant="ghost"
              size="xs"
              className="h-auto px-2 py-1 group"
              onClick={handleCancelEditQueuedMessage}
              title="Cancel editing"
            >
              <Typography variant="xs" className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">cancel</Typography>
            </Button>
          </div>
        )}

        <ComposerPrimitive.Root className={`relative flex w-full flex-col rounded-md ${isEditingQueuedMessage ? 'rounded-t-none' : ''}`} data-tab-id={assistantTabId}>
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
          <div className={`bg-accent border-0 ${isEditingQueuedMessage ? 'rounded-t-none' : 'rounded-t-md'} border-t border-zinc-300 dark:border-zinc-700 max-h-[50vh] overflow-y-auto`}>
            <ChatTiptapComposer
              hiddenInputRef={inputRef}
              userInfo={userInfo}
              onFileAttach={onFileAttach}
              onAttachmentPayload={onAttachmentPayload}
              placeholder="Ask anything or type @ to mention a file..."
              className="min-h-16"
              onSend={() => handleSend({
                composer,
                onSend: onSend,
                tabId: assistantTabId,
                composerContainerRef,
                proseMirrorRef,
                inputRef
              })}
              onEditorMount={(editor) => {
                // Capture the ProseMirror DOM element ref
                if (editor?.view?.dom) {
                  proseMirrorRef.current = editor.view.dom as HTMLElement;
                }
              }}
              isRunning={isRunning}
              onQueueMessage={onQueueMessage}
              hasQueuedMessages={queuedMessages.length > 0}
              onSendNextQueued={onSendNextQueued}
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
            toolPreferences={toolPreferences}
            onUpdateToolPreferences={(prefs) => onUpdateToolPreferences(prefs)}
            onAttachmentPayload={onAttachmentPayload}
            onSend={() => handleSend({
              composer,
              onSend: onSend,
              tabId: assistantTabId,
              composerContainerRef,
              proseMirrorRef,
              inputRef
            })}
            messageBuffer={messageBuffer}
            inputRef={inputRef}
            sendButtonRef={sendButtonRef}
            assistantTabId={assistantTabId}
            isRunning={isRunning}
            hasQueuedMessages={queuedMessages.length > 0}
            onSendNextQueued={onSendNextQueued}
            onQueueMessage={onQueueMessage}
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
  toolPreferences: ComposerToolPreferences;
  onUpdateToolPreferences: (prefs: ComposerToolPreferences) => void;
  onAttachmentPayload: (fileId: string, payload: { fileData: string; mimeType: string }) => void;
  onSend: () => void;
  // Fallback message buffer for context calculation when runtime messages aren't available
  messageBuffer?: any[] | null;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  sendButtonRef: React.RefObject<HTMLButtonElement | null>;
  assistantTabId?: string;
  // Message queue props
  isRunning: boolean;
  hasQueuedMessages: boolean;
  onSendNextQueued: () => void;
  onQueueMessage: (text: string) => void;
}

const ComposerAction: FC<ComposerActionProps> = ({ attachedFiles, attachedEmails, onFileAttach, onFileRemove, onEmailAttach, onEmailRemove, userInfo, toolPreferences, onUpdateToolPreferences, onAttachmentPayload, onSend, messageBuffer, inputRef, sendButtonRef, assistantTabId, isRunning, hasQueuedMessages, onSendNextQueued, onQueueMessage }) => {
  const composer = useComposerRuntime();
  const threadRuntime = useThreadRuntime();
  const [hasText, setHasText] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const previousWidthRef = useRef<number>(0);
  const isMeasuringRef = useRef<boolean>(true);
  const [visibleButtons, setVisibleButtons] = useState({
    model: true,
    plus: true,
    mic: true,
    modeText: true,
  });
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(true);

  // Track streaming content length to trigger context budget recalculation
  // This is needed because threadRuntime.messages reference doesn't change during streaming
  const [streamingContentLength, setStreamingContentLength] = useState(0);

  // Helper to get messages from thread runtime (tries multiple access patterns)
  const getThreadMessages = useCallback(() => {
    try {
      // Try different ways to access messages (assistant-ui runtime internals vary)
      const messages1 = threadRuntime?.messages || [];
      const messages2 = (threadRuntime as any)?._threadBinding?.getState?.()?.messages || [];
      const messages3 = (threadRuntime as any)?.getState?.()?.messages || [];
      
      // Return the first non-empty array from runtime sources
      if (messages1.length > 0) return messages1;
      if (messages2.length > 0) return messages2;
      if (messages3.length > 0) return messages3;
      
      // Fallback to message buffer if provided (used when loading conversations)
      if (messageBuffer && messageBuffer.length > 0) return messageBuffer;
      
      return [];
    } catch {
      // Fallback to message buffer on error
      if (messageBuffer && messageBuffer.length > 0) return messageBuffer;
      return [];
    }
  }, [threadRuntime, messageBuffer]);

  // Poll for streaming content changes to update context wheel
  useEffect(() => {
    const updateStreamingContent = () => {
      try {
        const messages = getThreadMessages();
        if (messages.length === 0) return;

        // Calculate total content length from all messages
        let totalLength = 0;
        for (const msg of messages) {
          const content = msg.content || [];
          if (Array.isArray(content)) {
            for (const part of content) {
              if (typeof part === "string") {
                totalLength += part.length;
              } else if (part?.type === "text" && part?.text) {
                totalLength += part.text.length;
              } else if (part?.type === "tool-call" && part?.args) {
                totalLength += JSON.stringify(part.args).length;
              } else if (part?.type === "tool-result" && part?.result) {
                const result = typeof part.result === "string" ? part.result : JSON.stringify(part.result);
                totalLength += result.length;
              }
            }
          } else if (typeof content === "string") {
            totalLength += content.length;
          }
        }

        // Only update if length changed to avoid unnecessary re-renders
        setStreamingContentLength((prev) => {
          if (prev !== totalLength) return totalLength;
          return prev;
        });
      } catch {
        // Ignore errors accessing runtime
      }
    };

    // Poll every 100ms to catch streaming updates
    const interval = setInterval(updateStreamingContent, 100);
    updateStreamingContent();

    return () => clearInterval(interval);
  }, [getThreadMessages]);

  // Compute context budget for the wheel
  const contextBudget = useMemo(() => {
    // Get thread messages from runtime using robust accessor
    const threadMessages = getThreadMessages();
    const normalizedMessages = threadMessages.map((msg: any) => ({
      role: msg.role || "user",
      content: msg.content || [],
    }));

    // Get document context preview (side-effect-free)
    const documentContextPreview = typeof window !== "undefined" 
      ? getDocumentContextPreview() 
      : "";

    // Build attachments summary
    const attachmentsSummary = [
      ...attachedFiles.map((f) => `[File: ${f.name}]`),
      ...attachedEmails.map((e) => `[Email: ${e.subject || "No subject"}]`),
    ].join(" ");

    const modelId = toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider);
    
    return computeContextBudget({
      modelId,
      provider: toolPreferences.model_provider,
      threadMessages: normalizedMessages,
      draftText,
      documentContextPreview,
      attachmentsSummary,
    });
  }, [getThreadMessages, draftText, attachedFiles, attachedEmails, toolPreferences.model_id, toolPreferences.model_provider, streamingContentLength]);

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
      const input = inputRef.current;
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
      // Use the ref to get the specific input for this tab instance
      const input = inputRef.current;
      if (!input) return;
      
      let text = '';
      
      // Always check the ProseMirror editor directly as the source of truth
      // Find the ProseMirror editor that belongs to this composer instance
      // Strategy 1: Find ProseMirror near the input (they're in the same composer)
      let proseMirror: Element | null = null;
      
      // Try multiple strategies to find the ProseMirror element
      // Strategy 1: Look for ProseMirror in the same parent container as the input
      const inputParent = input.parentElement;
      if (inputParent) {
        // The input is inside ComposerPrimitive.Root, ProseMirror is in a sibling div
        const composerRoot = inputParent.closest('[class*="flex-col"]');
        if (composerRoot) {
          proseMirror = composerRoot.querySelector('.ProseMirror');
        }
      }
      
      // Strategy 2: If not found, search from containerRef
      if (!proseMirror && containerRef.current) {
        const container = containerRef.current;
        // Go up to find the composer root, then find ProseMirror
        const composerRoot = container.closest('[class*="flex-col"]') || container.parentElement;
        if (composerRoot) {
          proseMirror = composerRoot.querySelector('.ProseMirror');
        }
      }
      
      // Strategy 3: Find ProseMirror that's closest to this input (by checking all and finding the one in the same tab)
      if (!proseMirror) {
        const allProseMirrors = document.querySelectorAll('.ProseMirror');
        for (const pm of Array.from(allProseMirrors)) {
          // Check if this ProseMirror is in the same tab as our input
          const pmTab = pm.closest('[class*="absolute"]');
          const inputTab = input.closest('[class*="absolute"]');
          if (pmTab === inputTab || (pm.closest('.min-h-16') && input.closest('.min-h-16'))) {
            proseMirror = pm;
            break;
          }
        }
      }
      
      if (proseMirror) {
        // Get text from ProseMirror element (this is the actual editor content)
        const paragraphs = Array.from(proseMirror.querySelectorAll('p'));
        if (paragraphs.length > 0) {
          text = paragraphs.map((p) => (p.textContent || '').trimEnd()).join('\n\n');
        } else {
          text = proseMirror.textContent || '';
        }
        
        // Sync textarea if it's out of sync
        if (input.value !== text) {
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        // Fallback to textarea value if we can't find ProseMirror
        text = input.value;
      }
      
      const trimmedText = text.trim();
      const newHasText = trimmedText.length > 0;
      
      // Always update state to ensure button state refreshes, especially when tab becomes active
      setHasText(newHasText);
      setDraftText(text);
    };

    // Listen for custom tiptap update events
    const handleTiptapUpdate = (event: CustomEvent) => {
      const text = event.detail?.text || '';
      setHasText(text.trim().length > 0);
      setDraftText(text);
    };

    // Check immediately
    checkForText();
    
    // Also check after a short delay to ensure DOM is ready
    setTimeout(checkForText, 100);
    setTimeout(checkForText, 300);

    // Set up an interval to check for changes more frequently
    const interval = setInterval(checkForText, 100);

    // Listen for tiptap update events
    document.addEventListener('tiptap-update', handleTiptapUpdate as EventListener);

    let lastActiveTabId: string | undefined = undefined;
    
    // Listen for when this tab becomes active
    const handleVisibilityChange = () => {
      // Check if this is the active tab
      const activeTabId = (window as any).__banburyActiveAiTabId;
      if (assistantTabId && activeTabId === assistantTabId) {
        // This tab just became active, check text immediately with multiple attempts
        setTimeout(checkForText, 0);
        setTimeout(checkForText, 50);
        setTimeout(checkForText, 150);
      }
    };

    // Check on window focus (user might have switched tabs)
    window.addEventListener('focus', handleVisibilityChange);
    
    // Poll for active tab changes and check immediately when tab becomes active
    const activeTabCheckInterval = setInterval(() => {
      const activeTabId = (window as any).__banburyActiveAiTabId;
      if (assistantTabId && activeTabId === assistantTabId) {
        // Check if this is a new activation (tab just became active)
        if (lastActiveTabId !== activeTabId) {
          // Tab just became active, check immediately
          checkForText();
          setTimeout(checkForText, 50);
          setTimeout(checkForText, 150);
        } else {
          // Tab is already active, just check normally
          checkForText();
        }
        lastActiveTabId = activeTabId;
      } else {
        lastActiveTabId = undefined;
      }
    }, 100); // Check more frequently

    // Use IntersectionObserver to detect when the container becomes visible (tab becomes active)
    let intersectionObserver: IntersectionObserver | null = null;
    const setupIntersectionObserver = () => {
      if (containerRef.current && !intersectionObserver) {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                // Tab became visible, check text immediately with multiple attempts
                checkForText();
                setTimeout(checkForText, 50);
                setTimeout(checkForText, 150);
              }
            });
          },
          { threshold: 0.1 }
        );
        intersectionObserver.observe(containerRef.current);
      }
    };

    // Set up observer immediately if container is available
    setupIntersectionObserver();

    // Also set up observer after a short delay in case container isn't ready yet
    const observerTimeout = setTimeout(setupIntersectionObserver, 100);

    // Use MutationObserver to detect when the tab container's 'hidden' class is removed
    let mutationObserver: MutationObserver | null = null;
    const setupMutationObserver = () => {
      // Find the tab container (parent with 'absolute' class that might have 'hidden' class)
      const tabContainer = containerRef.current?.closest('[class*="absolute"]');
      if (tabContainer && !mutationObserver) {
        mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const target = mutation.target as HTMLElement;
              // Check if 'hidden' class was removed (tab became visible)
              if (!target.classList.contains('hidden') && target.offsetParent !== null) {
                // Tab became visible, check text immediately
                setTimeout(checkForText, 0);
                setTimeout(checkForText, 50);
                setTimeout(checkForText, 150);
              }
            }
          });
        });
        mutationObserver.observe(tabContainer, {
          attributes: true,
          attributeFilter: ['class'],
          subtree: false
        });
      }
    };

    // Set up mutation observer after a delay to ensure DOM is ready
    const mutationObserverTimeout = setTimeout(setupMutationObserver, 200);

    return () => {
      clearInterval(interval);
      clearInterval(activeTabCheckInterval);
      clearTimeout(observerTimeout);
      clearTimeout(mutationObserverTimeout);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('tiptap-update', handleTiptapUpdate as EventListener);
      if (intersectionObserver && containerRef.current) {
        intersectionObserver.unobserve(containerRef.current);
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
    };
  }, [inputRef, assistantTabId]);

  // Monitor container size and hide buttons when space is limited
  useEffect(() => {
    if (!containerRef.current || !buttonsRef.current) return

    const checkButtonVisibility = () => {
      const container = containerRef.current
      const buttonsContainer = buttonsRef.current
      if (!container || !buttonsContainer) return

      const containerWidth = container.offsetWidth
      if (containerWidth === 0) return // Container not ready yet
      
      const sendButtonWidth = 36 // h-7 w-7 = 28px + padding
      const padding = 16 // p-2 = 8px on each side
      const gap = 8 // gap-2 = 8px
      
      // Reserve space for send button and padding
      const availableWidth = containerWidth - sendButtonWidth - padding * 2
      if (availableWidth <= 0) {
        // Not enough space for any buttons, hide all
        setVisibleButtons({
          model: false,
          plus: false,
          mic: false,
          modeText: false,
        })
        setIsMeasuring(false)
        isMeasuringRef.current = false
        previousWidthRef.current = containerWidth
        return
      }
      
      // Function to measure buttons and determine visibility
      const measureButtons = () => {
        // Get all button elements in priority order (most important first)
        const buttonElements = Array.from(buttonsContainer.children) as HTMLElement[]
        if (buttonElements.length === 0) {
          // If no buttons are rendered yet and we're measuring, retry
          if (isMeasuringRef.current) {
            setTimeout(measureButtons, 50)
          }
          return
        }

        let totalWidth = 0
        const buttonKeys: Array<keyof typeof visibleButtons> = ['model', 'plus', 'mic']
        const newVisibility: typeof visibleButtons = {
          model: false,
          plus: false,
          mic: false,
          modeText: false,
        }

        // Calculate which buttons fit, starting with highest priority
        for (let i = 0; i < buttonElements.length && i < buttonKeys.length; i++) {
          const button = buttonElements[i]
          const buttonWidth = button.offsetWidth + gap
          const key = buttonKeys[i]
          
          if (key && totalWidth + buttonWidth <= availableWidth) {
            totalWidth += buttonWidth
            newVisibility[key] = true
          } else {
            // Stop checking remaining buttons
            break
          }
        }

        // Set modeText to true only if all other buttons are visible (no overflow)
        newVisibility.modeText = newVisibility.model && newVisibility.plus && newVisibility.mic

        setVisibleButtons(newVisibility)
        setIsMeasuring(false)
        isMeasuringRef.current = false
        previousWidthRef.current = containerWidth
      }
      
      // If container got wider, temporarily enable measuring to show all buttons for measurement
      const containerGotWider = containerWidth > previousWidthRef.current && previousWidthRef.current > 0
      if (containerGotWider) {
        setIsMeasuring(true)
        isMeasuringRef.current = true
        // Wait for DOM to update before measuring
        setTimeout(measureButtons, 50)
        return
      }
      
      // Otherwise measure immediately
      measureButtons()
    }

    // Use ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure DOM has updated
      setTimeout(checkButtonVisibility, 0)
    })

    resizeObserver.observe(containerRef.current)

    // Initial check after a brief delay to ensure all buttons are rendered
    const timeoutId = setTimeout(() => {
      checkButtonVisibility()
    }, 100)

    // Also check on window resize
    window.addEventListener('resize', checkButtonVisibility)

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', checkButtonVisibility)
    }
  }, []);

  const handleSendFromButton = () => {
    // Simply call the onSend function which handles document context
    onSend();
  };

  // Queue message from button click when agent is running
  const handleQueueFromButton = () => {
    // Get current text from editor
    const proseMirror = document.querySelector('.ProseMirror');
    let text = '';
    if (proseMirror) {
      const paragraphs = Array.from(proseMirror.querySelectorAll('p'));
      if (paragraphs.length > 0) {
        text = paragraphs.map((p) => (p.textContent || '').trimEnd()).join('\n\n');
      } else {
        text = proseMirror.textContent || '';
      }
    }
    
    if (text.trim() && onQueueMessage) {
      onQueueMessage(text.trim());
      // Clear the editor
      window.dispatchEvent(new CustomEvent('composer-clear'));
    }
  };

  return (
    <div ref={containerRef} className="bg-accent border-0 relative flex items-center justify-between rounded-b-md p-2">
      <div ref={buttonsRef} className="flex pl-4 items-center gap-2">
        {/* Mode Selector - Agent/Plan/Ask */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              className="h-7 px-2 gap-1 hover:bg-accent hover:text-primary"
              title="Mode"
              aria-label="Mode"
            >
              {toolPreferences.ask_mode ? (
                <Search height={14} width={14} strokeWidth={1.5} className="mr-1" />
              ) : toolPreferences.plan_mode ? (
                <ClipboardList height={14} width={14} strokeWidth={1.5} className="mr-1" />
              ) : (
                <Infinity height={14} width={14} strokeWidth={1.5} className="mr-1" />
              )}
              {visibleButtons.modeText && (
                <Typography variant="small" className="text-xs font-medium">
                  {toolPreferences.ask_mode ? "Ask" : toolPreferences.plan_mode ? "Plan" : "Agent"}
                </Typography>
              )}
              <ChevronDown height={16} width={16} strokeWidth={1} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-48 p-0 bg-popover text-popover-foreground border shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          >
            <div className="p-1 flex flex-col">
              {/* Agent Mode Option */}
              <div
                className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onUpdateToolPreferences({
                    ...toolPreferences,
                    plan_mode: false,
                    ask_mode: false
                  })
                }}
              >
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  {!toolPreferences.plan_mode && !toolPreferences.ask_mode && <Check className="size-4" />}
                </span>
                <Infinity height={16} width={16} strokeWidth={1.5} className="text-muted-foreground" />
                <Typography variant="xs">Agent</Typography>
              </div>
              {/* Ask Mode Option */}
              <div
                className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onUpdateToolPreferences({
                    ...toolPreferences,
                    plan_mode: false,
                    ask_mode: true
                  })
                }}
              >
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  {toolPreferences.ask_mode && <Check className="size-4" />}
                </span>
                <Search height={16} width={16} strokeWidth={1.5} className="text-blue-500" />
                <Typography variant="xs">Ask</Typography>
              </div>
              {/* Plan Mode Option */}
              <div
                className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onUpdateToolPreferences({
                    ...toolPreferences,
                    plan_mode: true,
                    ask_mode: false
                  })
                }}
              >
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  {toolPreferences.plan_mode && <Check className="size-4" />}
                </span>
                <ClipboardList height={16} width={16} strokeWidth={1.5} className="text-emerald-500" />
                <Typography variant="xs">Plan</Typography>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {(isMeasuring || visibleButtons.model) && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="primary"
                size="xs"
                className="h-7 px-2 gap-1"
                title="Model"
                aria-label="Model"
              >
                <Typography variant="small" className="text-xs font-medium">
                  {getModelDisplayName(toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider))}
                </Typography>
                <ChevronDown height={16} width={16} strokeWidth={1} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-56 p-0 bg-popover text-popover-foreground border shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-h-96 overflow-y-auto"
            >
              <div className="p-1 flex flex-col">
                {AVAILABLE_MODELS.filter(m => {
                  const visibleModels = toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS;
                  return m.provider === "openai" && visibleModels.includes(m.id);
                }).map(model => {
                  const isSelected = (toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider)) === model.id
                  return (
                    <div
                      key={model.id}
                      className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        const selectedModel = getModelById(model.id)
                        if (selectedModel) {
                          onUpdateToolPreferences({ 
                            ...toolPreferences, 
                            model_id: model.id,
                            model_provider: selectedModel.provider 
                          })
                        }
                      }}
                    >
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        {isSelected && <Check className="size-4" />}
                      </span>
                      <div className="flex items-center">
                        <Typography variant="xs">{model.name}</Typography>
                      </div>
                    </div>
                  )
                })}
                {AVAILABLE_MODELS.filter(m => {
                  const visibleModels = toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS;
                  return m.provider === "anthropic" && visibleModels.includes(m.id);
                }).map(model => {
                  const isSelected = (toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider)) === model.id
                  return (
                    <div
                      key={model.id}
                      className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        const selectedModel = getModelById(model.id)
                        if (selectedModel) {
                          onUpdateToolPreferences({ 
                            ...toolPreferences, 
                            model_id: model.id,
                            model_provider: selectedModel.provider 
                          })
                        }
                      }}
                    >
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        {isSelected && <Check className="size-4" />}
                      </span>
                      <div className="flex items-center">
                        <Typography variant="xs">{model.name}</Typography>
                      </div>
                    </div>
                  )
                })}
                {AVAILABLE_MODELS.filter(m => {
                  const visibleModels = toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS;
                  return m.provider === "google" && visibleModels.includes(m.id);
                }).map(model => {
                  const isSelected = (toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider)) === model.id
                  return (
                    <div
                      key={model.id}
                      className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        const selectedModel = getModelById(model.id)
                        if (selectedModel) {
                          onUpdateToolPreferences({ 
                            ...toolPreferences, 
                            model_id: model.id,
                            model_provider: selectedModel.provider 
                          })
                        }
                      }}
                    >
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        {isSelected && <Check className="size-4" />}
                      </span>
                      <div className="flex items-center">
                        <Typography variant="xs">{model.name}</Typography>
                      </div>
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
        {(isMeasuring || visibleButtons.plus) && (
          <DropdownMenu open={isPlusMenuOpen} onOpenChange={setIsPlusMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="primary"
                size="xs"
                className="h-7 w-7"
                title="More actions"
                aria-label="More actions"
              >
                <Plus height={16} width={16} strokeWidth={1} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="top" 
              align="start"
              className="w-48"
            >
              {/* Attach File Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Paperclip className="mr-2 h-4 w-4" />
                  <Typography variant="xs">Attach file</Typography>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0">
                  <FileAttachmentPicker
                    onFileAttach={(file) => {
                      onFileAttach(file)
                      setIsPlusMenuOpen(false)
                    }}
                    userInfo={userInfo}
                    isOpen={isPlusMenuOpen}
                  />
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Upload Local File */}
              <DropdownMenuItem
                onClick={() => {
                  handleLocalFileUpload({
                    userInfo,
                    onFileAttach,
                    onAttachmentPayload,
                    onError: (error) => console.error('Upload error:', error),
                    onSuccess: () => {}
                  })
                  setIsPlusMenuOpen(false)
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                <Typography variant="xs">Upload file</Typography>
              </DropdownMenuItem>

              {/* Image Model Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Image className="mr-2 h-4 w-4" />
                  <Typography variant="xs">Image model</Typography>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56 p-1">
                  {IMAGE_GENERATION_MODELS.map((model) => {
                    const isSelected = (toolPreferences.image_generation_model || 'dall-e-3') === model.id
                    return (
                      <div
                        key={model.id}
                        className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          onUpdateToolPreferences(setImageGenerationModel(toolPreferences, model.id))
                        }}
                      >
                        <span className="absolute right-2 flex size-3.5 items-center justify-center">
                          {isSelected && <Check className="size-4" />}
                        </span>
                        <div className="flex flex-col">
                          <Typography variant="xs" className="font-medium">{model.name}</Typography>
                          <Typography variant="xs" className="text-xs text-muted-foreground">{model.description}</Typography>
                        </div>
                      </div>
                    )
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Video Model Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Video className="mr-2 h-4 w-4" />
                  <Typography variant="xs">Video model</Typography>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56 p-1">
                  {VIDEO_GENERATION_MODELS.map((model) => {
                    const isSelected = (toolPreferences.video_generation_model || 'sora-2') === model.id
                    return (
                      <div
                        key={model.id}
                        className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          onUpdateToolPreferences(setVideoGenerationModel(toolPreferences, model.id))
                        }}
                      >
                        <span className="absolute right-2 flex size-3.5 items-center justify-center">
                          {isSelected && <Check className="size-4" />}
                        </span>
                        <div className="flex flex-col">
                          <Typography variant="xs" className="font-medium">{model.name}</Typography>
                          <Typography variant="xs" className="text-xs text-muted-foreground">{model.description}</Typography>
                        </div>
                      </div>
                    )
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Tools Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Wrench className="mr-2 h-4 w-4" />
                  <Typography variant="xs">Tools</Typography>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-72 p-1 max-h-96 overflow-y-auto">
                  {toolConfigs.map((tool) => {
                    const Icon = tool.icon
                    const isEnabled = (toolPreferences[tool.key] as boolean) ?? tool.defaultEnabled
                    
                    return (
                      <div
                        key={tool.key}
                        className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          const toolKey = tool.key as keyof ComposerToolPreferences
                          if (typeof toolPreferences[toolKey] === 'boolean') {
                            onUpdateToolPreferences(
                              toggleToolPreference(toolPreferences, toolKey, isEnabled)
                            )
                          }
                        }}
                      >
                        <span className="absolute right-2 flex size-3.5 items-center justify-center">
                          {isEnabled && <Check className="size-4" />}
                        </span>
                        <div className="flex items-center">
                          <Icon size={16} strokeWidth={1} className={`mr-2 ${tool.iconColor}`} />
                          <Typography variant="xs" className="text-xs font-medium">
                            {tool.label}
                          </Typography>
                        </div>
                      </div>
                    )
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {(isMeasuring || visibleButtons.mic) && (
          <Button
            variant="primary"
            size="xs"
            className={`h-7 w-7 ${
              isRecording
                ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                : ""
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? "Stop recording" : "Start voice input"}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
            disabled={!(typeof window !== 'undefined' && (((window as any).SpeechRecognition) || ((window as any).webkitSpeechRecognition)))}
          >
            {isRecording ? <MicOff height={16} width={16} strokeWidth={1} /> : <Mic height={16} width={16} strokeWidth={1} />}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Context wheel showing token usage */}
        <TooltipProvider>
          <ContextWheel
            usagePercent={contextBudget.usagePercent}
            estimatedPromptTokens={contextBudget.estimatedPromptTokens}
            contextWindowTokens={contextBudget.contextWindowTokens}
            estimatedRemainingTokens={contextBudget.estimatedRemainingTokens}
            reservedOutputTokens={contextBudget.reservedOutputTokens}
          />
        </TooltipProvider>

        <ThreadPrimitive.If running={false}>
          <Button
            ref={sendButtonRef}
            type="button"
            variant="primary"
            size="xs"
            className={`h-7 w-7 ${
              hasText
                ? 'cursor-pointer bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100'
                : 'opacity-50 bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
            }`}
            title="Send"
            aria-label="Send message"
            onClick={handleSendFromButton}
            disabled={!hasText}
          >
            <ChevronRightIcon height={16} width={16} strokeWidth={1} />
          </Button>
        </ThreadPrimitive.If>

        <ThreadPrimitive.If running>
          <div className="flex items-center gap-2">
            {/* Queue button - shown when agent is running and there's text to queue */}
            {hasText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="primary"
                      size="xs"
                      title="Add message to queue"
                      aria-label="Add message to queue"
                      className="h-7 px-2 gap-1 cursor-pointer bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600"
                      onClick={handleQueueFromButton}
                    >
                      <Plus height={14} width={14} strokeWidth={1.5} />
                      <Typography variant="xs" className="font-medium">Queue</Typography>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <Typography variant="xs">Press Enter to add message to queue (will send after current task)</Typography>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* Send Next button - shown when agent is running and there are queued messages */}
            {hasQueuedMessages && !hasText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="primary"
                      size="xs"
                      title="Send next queued message (interrupts current)"
                      aria-label="Send next queued message"
                      className="h-7 px-2 gap-1 cursor-pointer bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                      onClick={onSendNextQueued}
                    >
                      <CornerDownLeft height={14} width={14} strokeWidth={1.5} />
                      <Typography variant="xs" className="font-medium">Send Next</Typography>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <Typography variant="xs">Press Enter to interrupt and send next queued message</Typography>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <ComposerPrimitive.Cancel asChild>
              <Button
                type="button"
                variant="primary"
                size="xs"
                title="Stop generating"
                aria-label="Stop generating"
                className="h-7 w-7 cursor-pointer bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100" 
              >
                <Square height={14} width={14} strokeWidth={1} />
              </Button>
            </ComposerPrimitive.Cancel>
          </div>
        </ThreadPrimitive.If>
      </div>
    </div>
  );
};

