import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as AssistantUI from "@assistant-ui/react";
import { ChatTiptapComposer } from "./components/ChatTiptapComposer";
import { FileAttachmentDisplay } from "./components/file-attachment-display";
import { QueuedMessagesDisplay, type QueuedMessage } from "./components/queued-messages-display";
import { PendingChangesBar } from "./components/pending-changes-bar";
import { ContextWheel } from "./components/context-wheel";
import { ModeSelector } from "./components/ModeSelector";
import { ModelSelector } from "./components/ModelSelector";
import { PlusMenu } from "./components/PlusMenu";
import { VoiceRecordingButton } from "./components/VoiceRecordingButton";
import { ComposerSendButton } from "./components/ComposerSendButton";
import { Button } from "../../common/ui/button";
import { TooltipProvider } from "../../common/ui/tooltip";
import { FileSystemItem } from "../../../utils/fileTreeUtils";
import { ThreadScrollToBottom } from "./ThreadScrollToBottom";
import { handleSend } from "./handlers/handleSend";
import { createComposerSendEventListener } from "./handlers/handleComposerSendEvent";
import { computeContextBudget } from "./handlers/contextBudget";
import { getDocumentContextPreview } from "../../../assistant/ClaudeRuntimeProvider/handlers/getDocumentContextPreview";
import {
  getDefaultModelForProvider,
} from "./handlers/getModelDisplayName";
import { checkIsRunning } from "./handlers/messageQueue";
import { checkButtonVisibility, type VisibleButtons } from "./handlers/checkButtonVisibility";
import { checkForText } from "./handlers/checkForText";
import { startRecording } from "./handlers/handleStartRecording";
import type { FC } from "react";
import { Typography } from "@/components/common/ui/typography";

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
  sheet_ai: boolean;
  docx_ai: boolean;
  pptx_ai: boolean;
  tldraw_ai: boolean;
  document_ai: boolean;
  create_file: boolean;
  create_folder: boolean;
  download_from_url: boolean;
  search_files: boolean;
  calendar: boolean;
  msCalendar: boolean;
  github: boolean;
  generate_image: boolean;
  generate_video: boolean;
  memory: boolean;
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
  pendingChanges: Array<{ id: string; type: string; description: string; filePath?: string }>;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onOpenFile?: (change: { id: string; type: string; description: string; filePath?: string }) => void;
  messageBuffer?: any[] | null;
  assistantTabId?: string;
  queuedMessages: QueuedMessage[];
  onQueueMessage: (text: string) => void;
  onRemoveQueuedMessage: (id: string) => void;
  onMoveQueuedMessageToFront: (id: string) => void;
  onSendNextQueued: () => void;
  composerAutofocus?: boolean;
}

export const Composer: FC<ComposerProps> = ({ attachedFiles, attachedEmails, onFileAttach, onFileRemove, onEmailAttach, onEmailRemove, userInfo, toolPreferences, onUpdateToolPreferences, attachmentPayloads, onAttachmentPayload, onSend, onFileView, pendingChanges, onAcceptAll, onRejectAll, onOpenFile, messageBuffer, assistantTabId, queuedMessages, onQueueMessage, onRemoveQueuedMessage, onMoveQueuedMessageToFront, onSendNextQueued, composerAutofocus = true }) => {
  const composer = useComposerRuntime();
  const threadRuntime = useThreadRuntime();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const composerContainerRef = useRef<HTMLDivElement | null>(null);
  const proseMirrorRef = useRef<HTMLElement | null>(null);
  const sendButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isEditingQueuedMessage, setIsEditingQueuedMessage] = useState(false);
  const isRunning = checkIsRunning(threadRuntime);

  useEffect(() => {
    if (!composer.attachments) return;
    
    composer.attachments.clear();

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
          onOpenFile={onOpenFile}
        />

        {/* Display editing queued message indicator */}
        {isEditingQueuedMessage && (
          <div className={`bg-accent border-b border-border px-2 py-1 flex items-center justify-between w-full ${queuedMessages.length === 0 && attachedFiles.length === 0 && attachedEmails.length === 0 && pendingChanges.length === 0 ? 'rounded-t-md' : ''}`}>
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

        <ComposerPrimitive.Root className={`relative flex w-full flex-col rounded-md ${isEditingQueuedMessage || pendingChanges.length > 0 ? 'rounded-t-none' : ''}`} data-tab-id={assistantTabId}>
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
          <div className={`bg-accent border-0 ${isEditingQueuedMessage || pendingChanges.length > 0 ? 'rounded-t-none' : 'rounded-t-md'} border-t border-zinc-300 dark:border-zinc-700 max-h-[50vh] overflow-y-auto`}>
            <ChatTiptapComposer
              hiddenInputRef={inputRef}
              userInfo={userInfo}
              autofocus={composerAutofocus}
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
  const [visibleButtons, setVisibleButtons] = useState<VisibleButtons>({
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

  const handleStartRecording: () => void = () => {
    startRecording({
      recognitionRef,
      inputRef,
      setHasText,
      setIsRecording,
    });
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
    const checkForTextHandler = () => {
      checkForText({
        inputRef,
        containerRef,
        setHasText,
        setDraftText,
        assistantTabId,
      });
    };

    // Listen for custom tiptap update events
    const handleTiptapUpdate = (event: CustomEvent) => {
      const text = event.detail?.text || '';
      setHasText(text.trim().length > 0);
      setDraftText(text);
    };

    // Check immediately
    checkForTextHandler();
    
    // Also check after a short delay to ensure DOM is ready
    setTimeout(checkForTextHandler, 100);
    setTimeout(checkForTextHandler, 300);

    // Set up an interval to check for changes more frequently
    const interval = setInterval(checkForTextHandler, 100);

    // Listen for tiptap update events
    document.addEventListener('tiptap-update', handleTiptapUpdate as EventListener);

    let lastActiveTabId: string | undefined = undefined;
    
    // Listen for when this tab becomes active
    const handleVisibilityChange = () => {
      // Check if this is the active tab
      const activeTabId = (window as any).__banburyActiveAiTabId;
      if (assistantTabId && activeTabId === assistantTabId) {
        // This tab just became active, check text immediately with multiple attempts
        setTimeout(checkForTextHandler, 0);
        setTimeout(checkForTextHandler, 50);
        setTimeout(checkForTextHandler, 150);
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
          checkForTextHandler();
          setTimeout(checkForTextHandler, 50);
          setTimeout(checkForTextHandler, 150);
        } else {
          // Tab is already active, just check normally
          checkForTextHandler();
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
                checkForTextHandler();
                setTimeout(checkForTextHandler, 50);
                setTimeout(checkForTextHandler, 150);
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
                setTimeout(checkForTextHandler, 0);
                setTimeout(checkForTextHandler, 50);
                setTimeout(checkForTextHandler, 150);
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
  }, [inputRef, containerRef, setHasText, setDraftText, assistantTabId]);

  // Monitor container size and hide buttons when space is limited
  useEffect(() => {
    if (!containerRef.current || !buttonsRef.current) return

    const handleCheckButtonVisibility = () => {
      checkButtonVisibility({
        containerRef,
        buttonsRef,
        setVisibleButtons,
        setIsMeasuring,
        isMeasuringRef,
        previousWidthRef,
      })
    }

    // Use ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure DOM has updated
      setTimeout(handleCheckButtonVisibility, 0)
    })

    resizeObserver.observe(containerRef.current)

    const timeoutId = setTimeout(() => {
      handleCheckButtonVisibility()
    }, 100)

    window.addEventListener('resize', handleCheckButtonVisibility)

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleCheckButtonVisibility)
    }
  }, []);

  const handleSendFromButton = () => {
    onSend();
  };

  return (
    <div ref={containerRef} className="bg-accent border-0 relative flex items-center justify-between rounded-b-md p-2 overflow-hidden gap-4">
      <div ref={buttonsRef} className="flex pl-4 items-center gap-2 min-w-0 flex-shrink overflow-x-auto scrollbar-hide flex-nowrap max-w-[calc(100%-120px)]">
        {/* Mode Selector - Agent/Plan/Ask */}
        <ModeSelector
          toolPreferences={toolPreferences}
          onUpdateToolPreferences={onUpdateToolPreferences}
          showText={visibleButtons.modeText}
        />
        <ModelSelector
          toolPreferences={toolPreferences}
          onUpdateToolPreferences={onUpdateToolPreferences}
          isMeasuring={isMeasuring}
          isVisible={visibleButtons.model}
        />
        <PlusMenu
          isMeasuring={isMeasuring}
          isVisible={visibleButtons.plus}
          isOpen={isPlusMenuOpen}
          onOpenChange={setIsPlusMenuOpen}
          userInfo={userInfo}
          toolPreferences={toolPreferences}
          onUpdateToolPreferences={onUpdateToolPreferences}
          onFileAttach={onFileAttach}
          onAttachmentPayload={onAttachmentPayload}
        />
        <VoiceRecordingButton
          isRecording={isRecording}
          onStartRecording={handleStartRecording}
          onStopRecording={stopRecording}
          isVisible={visibleButtons.mic}
          isMeasuring={isMeasuring}
        />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
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

        <ComposerSendButton
          sendButtonRef={sendButtonRef}
          hasText={hasText}
          onSend={handleSendFromButton}
          hasQueuedMessages={hasQueuedMessages}
          onSendNextQueued={onSendNextQueued}
        />
      </div>
    </div>
  );
};

