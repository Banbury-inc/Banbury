import * as AssistantUI from "@assistant-ui/react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import DrawioViewerModal from "../../../MiddlePanel/CanvasViewer/DrawioViewerModal";
import { Button } from "../../../common/ui/button";
import { handleDocxAIResponse } from "../../handlers/handle-docx-ai-response"
import { handleCodeEditAIResponse } from "../../handlers/handle-code-edit-ai-response"
import { handleTldrawAIResponse } from "../../handlers/handle-tldraw-ai-response";
import { ToolUI } from "../../ToolUI";
import { ApiService } from "../../../../../backend/api/apiService";
import { useToast } from "../../../common/ui/use-toast";
import styles from "../../../../styles/scrollbar.module.css";
import { cn } from "../../../../utils";
import { FileSystemItem } from "../../../../utils/fileTreeUtils";
import { createHandleDrawioFileView } from "../../handlers/handle-drawio-file-view";
import { Composer } from "../Composer";
import { UserMessage } from "./components/UserMessage";
import { ThreadWelcome } from "./components/ThreadWelcome";
import { StreamingStatus } from "./components/StreamingStatus";
import { AssistantMessage } from "./components/AssistantMessage";
import { LoadConversationDialog } from "./components/LoadConversationDialog";
import { SaveConversationDialog } from "./components/SaveConversationDialog";
import type { QueuedMessage } from "../components/queued-messages-display";
import { getDefaultVisibleModels, getModelsCatalogRevision } from "../handlers/getModelDisplayName"
import { fetchAnthropicModelsCatalog } from "../handlers/fetchAnthropicModelsCatalog"
import { fetchGoogleModelsCatalog } from "../handlers/fetchGoogleModelsCatalog"
import { fetchOpenAIModelsCatalog } from "../handlers/fetchOpenAIModelsCatalog"
import type { FC } from "react";
import { Typography } from "../../../common/ui/typography";
import { isViewableFileExtended } from "../../../../pages/Workspaces/handlers/fileTypeUtils";
import { loadConversation as loadConversationHandler } from "./handlers/loadConversation";
import { handleRunEnd as handleRunEndHandler } from "./handlers/handleRunEnd";
import { fetchMissingPayloads as fetchMissingPayloadsHandler } from "./handlers/fetchMissingPayloads";
import { tryApplyMessagesToRuntime } from "./handlers/tryApplyMessagesToRuntime";
import { deriveToolPreferences, type ThreadToolPreferences } from "./handlers/deriveToolPreferences";
import { saveCurrentConversation as saveCurrentConversationHandler } from "./handlers/saveCurrentConversation";
import { loadConversations as loadConversationsHandler } from "./handlers/loadConversations";
import { handleStorageChange } from "./handlers/handleStorageChange";
import { syncAttachmentsToLocalStorage } from "./handlers/syncAttachmentsToLocalStorage";
import { syncCurrentCodeFileContext } from "./handlers/syncCurrentCodeFileContext";


// Destructure Assistant UI primitives from namespace import to avoid named import type issues
const {
  ThreadPrimitive,
  ComposerPrimitive,
  BranchPickerPrimitive,
  useThreadRuntime,
} = AssistantUI as any;

interface ThreadProps {
  userInfo: {
    username: string;
    email?: string;
  } | null;
  selectedFile?: FileSystemItem | null;
  selectedEmail?: any | null;
  onEmailSelect?: (email: any) => void;
  assistantTabId?: string;
  /** Disable composer autofocus to prevent scroll-to-input on mount (e.g. in embedded demos) */
  composerAutofocus?: boolean;
}

export const Thread: FC<ThreadProps> = ({ userInfo, selectedFile, selectedEmail, onEmailSelect, assistantTabId, composerAutofocus = true }) => {
  const { toast } = useToast();
  const [attachedFiles, setAttachedFiles] = useState<FileSystemItem[]>([]);
  const [attachedEmails, setAttachedEmails] = useState<any[]>([]);
  const lastAutoAttachedFileIdRef = useRef<string | null>(null);
  const lastAutoAttachedEmailIdRef = useRef<string | null>(null);

  // Reset the auto-attach refs when the tab changes
  useEffect(() => {
    lastAutoAttachedFileIdRef.current = null;
    lastAutoAttachedEmailIdRef.current = null;
  }, [assistantTabId]);
  const [drawioModalOpen, setDrawioModalOpen] = useState(false);
  const [selectedDrawioFile, setSelectedDrawioFile] = useState<FileSystemItem | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Array<{ id: string; type: string; description: string; filePath?: string }>>([]);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const runtime = useThreadRuntime();

  const [toolPreferences, setToolPreferences] = useState<ThreadToolPreferences>(() => {
    try {
      const saved = localStorage.getItem("toolPreferences");
      if (saved) return deriveToolPreferences(JSON.parse(saved));
    } catch {}
    return deriveToolPreferences();
  });
  const [dynamicModelsCatalogRevision, setDynamicModelsCatalogRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetchOpenAIModelsCatalog(),
      fetchAnthropicModelsCatalog(),
      fetchGoogleModelsCatalog(),
    ])
      .then((results) => {
        if (cancelled) return;
        setDynamicModelsCatalogRevision(getModelsCatalogRevision());
        const openaiModels =
          results[0].status === "fulfilled" ? results[0].value : [];
        const claudeModels =
          results[1].status === "fulfilled" ? results[1].value : [];
        const googleModels =
          results[2].status === "fulfilled" ? results[2].value : [];
        try {
          const saved = localStorage.getItem("toolPreferences");
          if (saved) return;
          setToolPreferences((prev) => ({
            ...prev,
            visibleModels: getDefaultVisibleModels(
              openaiModels.map((m) => m.id),
              claudeModels.map((m) => m.id),
              googleModels.map((m) => m.id),
            ),
          }));
        } catch {
          // ignore
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const [attachmentPayloads, setAttachmentPayloads] = useState<Record<string, { fileData: string; mimeType: string }>>({});
  const [threadKey, setThreadKey] = useState<number>(0);
  const [loadedMessagesBuffer, setLoadedMessagesBuffer] = useState<any[] | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");

  const handleFileAttach = (file: FileSystemItem) => {
    setAttachedFiles(prev => {
      // Check if the file is already attached
      const isAlreadyAttached = prev.some(f => f.file_id === file.file_id);
      
      if (isAlreadyAttached) {
        return prev;
      }
      
      return [...prev, file];
    });
  };

  const handleFileRemove = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.file_id !== fileId));
  };

  const handleEmailAttach = (email: any) => {
    setAttachedEmails(prev => [...prev, email]);
  };

  const handleEmailRemove = (emailId: string) => {
    setAttachedEmails(prev => prev.filter(email => email.id !== emailId));
  };

  const handleAttachmentPayload = (fileId: string, payload: { fileData: string; mimeType: string }) => {
    setAttachmentPayloads(prev => ({ ...prev, [fileId]: payload }));
  };

  const handleDrawioFileView = createHandleDrawioFileView({
    setSelectedDrawioFile,
    setDrawioModalOpen,
  });

  const handleDrawioModalClose = () => {
    setDrawioModalOpen(false);
    setSelectedDrawioFile(null);
  };

  // Message queue handlers
  const handleQueueMessage = useCallback((text: string) => {
    const newMessage: QueuedMessage = {
      id: `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      timestamp: Date.now()
    };
    setQueuedMessages(prev => [...prev, newMessage]);
  }, []);

  const handleRemoveQueuedMessage = useCallback((id: string) => {
    setQueuedMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const handleMoveQueuedMessageToFront = useCallback((id: string) => {
    setQueuedMessages(prev => {
      const index = prev.findIndex(msg => msg.id === id);
      if (index <= 0) return prev;
      
      const message = prev[index];
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      newQueue.unshift(message);
      return newQueue;
    });
  }, []);

  const handleSendNextQueued = useCallback(() => {
    if (queuedMessages.length === 0) return;
    
    const nextMessage = queuedMessages[0];
    setQueuedMessages(prev => prev.slice(1));
    
    // Cancel the current run first
    try {
      runtime?.cancelRun?.();
    } catch {}
    
    // Send the next queued message
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('assistant-composer-send', {
        detail: { tabId: assistantTabId, text: nextMessage.text }
      }));
    }, 100);
  }, [queuedMessages, runtime, assistantTabId]);

  // Auto-send next queued message when run completes
  useEffect(() => {
    const handleStreamDone = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { success, status } = customEvent.detail || {};
      
      // Only auto-send if the run completed successfully and there are queued messages
      if (success && status?.type === 'complete' && queuedMessages.length > 0) {
        // Small delay to ensure UI has updated
        setTimeout(() => {
          const nextMessage = queuedMessages[0];
          setQueuedMessages(prev => prev.slice(1));
          
          // Send the next queued message
          window.dispatchEvent(new CustomEvent('assistant-composer-send', {
            detail: { tabId: assistantTabId, text: nextMessage.text }
          }));
        }, 300);
      }
    };

    window.addEventListener('assistant-stream-done', handleStreamDone);
    return () => window.removeEventListener('assistant-stream-done', handleStreamDone);
  }, [queuedMessages, assistantTabId]);

  // Conversation management functions
  const loadConversations = async () => {
    await loadConversationsHandler({
      userInfo,
      setConversations,
      setIsLoadingConversations,
    });
  };

  const saveCurrentConversation = async () => {
    await saveCurrentConversationHandler({
      userInfo,
      conversationTitle,
      runtime,
      attachedFiles,
      attachedEmails,
      toolPreferences,
      setSaveDialogOpen,
      setConversationTitle,
      loadConversations,
    });
  };

  const loadConversation = async (conversationId: string) => {
    await loadConversationHandler({
      conversationId,
      runtime,
      setAttachedFiles,
      setAttachedEmails,
      setToolPreferences,
      setLoadedMessagesBuffer,
      setThreadKey,
      setShowConversationDialog,
      deriveToolPreferences,
      tryApplyMessagesToRuntime,
    });
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const result = await ApiService.Conversations.deleteConversation(conversationId);
      if (result.success) {
        await loadConversations();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Auto-attach the selected file from Workspaces
  useEffect(() => {
    if (selectedFile && selectedFile.file_id) {
      // Skip if we've already auto-attached this exact file for this tab
      // (but allow attaching if selectedFile changes to a different file)
      if (lastAutoAttachedFileIdRef.current === selectedFile.file_id) {
        return;
      }
      
      // Only attach if it's a viewable file type (supports local, Drive, and OneDrive files)
      if (isViewableFileExtended(selectedFile)) {
        // Use handleFileAttach which includes duplicate checking (checks attachedFiles state)
        // This provides a second layer of protection against duplicates
        handleFileAttach(selectedFile);
        // Track that we've auto-attached this file for this tab
        lastAutoAttachedFileIdRef.current = selectedFile.file_id;
      }
    } else {
      // Reset ref when selectedFile is cleared
      lastAutoAttachedFileIdRef.current = null;
    }
  }, [selectedFile]);

  // Auto-attach the selected email from Email tab
  useEffect(() => {
    if (selectedEmail && selectedEmail.id) {
      // Skip if we've already auto-attached this exact email for this tab
      if (lastAutoAttachedEmailIdRef.current === selectedEmail.id) {
        return;
      }

      // Check if the email is already attached
      const isAlreadyAttached = attachedEmails.some(e => e.id === selectedEmail.id);

      if (!isAlreadyAttached) {
        setAttachedEmails(prev => [selectedEmail, ...prev]);
      }
      // Track that we've auto-attached this email for this tab
      lastAutoAttachedEmailIdRef.current = selectedEmail.id;
    } else {
      // When email is deselected (tab closed), remove the auto-attached email
      if (lastAutoAttachedEmailIdRef.current) {
        setAttachedEmails(prev => prev.filter(e => e.id !== lastAutoAttachedEmailIdRef.current));
        lastAutoAttachedEmailIdRef.current = null;
      }
    }
  }, [selectedEmail]);

  // Keep active code-file context in localStorage for AI code-edit tool calls.
  useEffect(() => {
    syncCurrentCodeFileContext(selectedFile || null);
  }, [selectedFile]);

  // Auto-save conversation when langgraph stream completes
  useEffect(() => {
    if (!runtime || !userInfo?.username) {
      return;
    }
    
    const handleRunEnd = async () => {
      await handleRunEndHandler({
        runtime,
        conversations,
        attachedFiles,
        attachedEmails,
        toolPreferences,
        loadConversations,
      });
    };
    
    // Try multiple event names that might indicate completion
    const unsubscribe1 = runtime.unstable_on('run-end', handleRunEnd);
    const unsubscribe2 = runtime.unstable_on('run-complete', handleRunEnd);
    const unsubscribe3 = runtime.unstable_on('message-end', handleRunEnd);
    
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [runtime, userInfo?.username, conversations, attachedFiles, attachedEmails, toolPreferences]);

  // Listen for global assistant-load-conversation events to show fallback buffer immediately
  useEffect(() => {
    const handler = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventTabId = customEvent.detail?.tabId;
      const msgs = customEvent.detail?.messages;
      
      // If tabId is specified in the event, only handle if it matches this tab
      if (eventTabId && assistantTabId && eventTabId !== assistantTabId) return;
      // If this thread has a tabId but event doesn't specify one, ignore (legacy behavior for non-tabbed usage)
      if (assistantTabId && !eventTabId) return;
      
      if (!Array.isArray(msgs)) return;

      // Optimistic UI: show messages immediately while importing
      setLoadedMessagesBuffer(msgs);

      try {
        // Reset runtime and try to import messages via robust helper
        try { (runtime as any)?.reset?.(); } catch {}
        const applied = await tryApplyMessagesToRuntime(runtime as any, msgs as any);
        if (applied.ok) {
          // Force rebind and clear buffer once runtime is hydrated
          setThreadKey(Date.now());
          setLoadedMessagesBuffer(null);
          return;
        }
      } catch {}

      // If import failed, keep buffer visible as a fallback
      setLoadedMessagesBuffer(msgs);
    };
    window.addEventListener('assistant-load-conversation', handler);
    return () => window.removeEventListener('assistant-load-conversation', handler);
  }, [runtime, assistantTabId]);

  // Listen for clear-conversation events to reset the conversation
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventTabId = customEvent.detail?.tabId;
      
      // If tabId is specified in the event, only handle if it matches this tab
      if (eventTabId && assistantTabId && eventTabId !== assistantTabId) {
        return;
      }
      // If this thread has a tabId but event doesn't specify one, check if this is the active tab
      if (assistantTabId && !eventTabId) {
        const activeTabId = (window as any).__banburyActiveAiTabId
        // Only ignore if activeTabId is set and doesn't match this thread
        // If activeTabId is undefined, we can't determine which is active, so handle this event
        if (activeTabId && assistantTabId !== activeTabId) {
          return;
        }
      }
      
      // Clear the loaded messages buffer to show welcome message
      setLoadedMessagesBuffer(null);
      // Reset the runtime if available
      if (runtime && runtime.reset) {
        runtime.reset();
      }
      // Force a re-render by updating the thread key
      setThreadKey(Date.now());
    };
    window.addEventListener('clear-conversation', handler);
    return () => window.removeEventListener('clear-conversation', handler);
  }, [runtime, assistantTabId]);

  // Load conversations on mount
  useEffect(() => {
    if (userInfo?.username) {
      loadConversations();
    }
  }, [userInfo?.username]);

  // Track pending changes from AI tools
  useEffect(() => {
    const handleChangeRegistered = (event: CustomEvent) => {
      const { id, type, description, filePath } = event.detail;
      setPendingChanges(prev => {
        // Avoid duplicates
        if (prev.some(c => c.id === id)) return prev;
        return [...prev, { id, type, description, filePath }];
      });
    };

    const handleChangeResolved = (event: CustomEvent) => {
      const { id } = event.detail;
      setPendingChanges(prev => prev.filter(c => c.id !== id));
    };

    window.addEventListener('ai-change-registered', handleChangeRegistered as EventListener);
    window.addEventListener('ai-change-resolved', handleChangeResolved as EventListener);
    
    return () => {
      window.removeEventListener('ai-change-registered', handleChangeRegistered as EventListener);
      window.removeEventListener('ai-change-resolved', handleChangeResolved as EventListener);
    };
  }, []);

  const handleAcceptAll = () => {
    window.dispatchEvent(new CustomEvent('ai-accept-all'));
    setPendingChanges([]);
  };

  const handleRejectAll = () => {
    window.dispatchEvent(new CustomEvent('ai-reject-all'));
    setPendingChanges([]);
  };

  const handleOpenFile = (change: { id: string; type: string; description: string; filePath?: string }) => {
    // If we have a file path, dispatch workspace-reopen-file event
    if (change.filePath) {
      const file = {
        id: change.filePath,
        file_id: change.filePath,
        name: change.description,
        type: 'file' as const,
        path: change.filePath,
      };
      window.dispatchEvent(new CustomEvent('workspace-reopen-file', {
        detail: { newFile: file }
      }));
    } else {
      // If no file path, try to find the file by name using a custom event
      // The workspace can handle finding the file by name
      window.dispatchEvent(new CustomEvent('workspace-find-and-open-file', {
        detail: { fileName: change.description }
      }));
    }
  };

  // Listen for DOCX AI response events
  useEffect(() => {
    const handleDocxResponse = (event: CustomEvent) => {
      handleDocxAIResponse(event.detail)
    }

    window.addEventListener('docx-ai-response', handleDocxResponse as EventListener)
    return () => window.removeEventListener('docx-ai-response', handleDocxResponse as EventListener)
  }, [])

  // Listen for code edit AI response events (applies edits to IDE in middle panel)
  useEffect(() => {
    const handleCodeEditResponse = (event: CustomEvent) => {
      handleCodeEditAIResponse(event.detail)
    }

    window.addEventListener('code-edit-ai-response', handleCodeEditResponse as EventListener)
    return () => window.removeEventListener('code-edit-ai-response', handleCodeEditResponse as EventListener)
  }, [])

  // Listen for Tldraw AI response events
  useEffect(() => {
    const handleTldrawResponse = async (event: Event) => {
      const customEvent = event as CustomEvent;
      await handleTldrawAIResponse(customEvent.detail);
    };

    window.addEventListener('tldraw-ai-response', handleTldrawResponse);
    return () => window.removeEventListener('tldraw-ai-response', handleTldrawResponse);
  }, []);

  // Keep a copy of attachments in localStorage so the runtime can inject them
  useEffect(() => {
    syncAttachmentsToLocalStorage({
      attachedFiles,
      attachedEmails,
      attachmentPayloads,
    });
  }, [attachedFiles, attachedEmails, attachmentPayloads]);

  // Remove attachment when a corresponding workspace tab is closed
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const { fileId, filePath, emailId } = detail || {};
      if (!fileId && !filePath && !emailId) return;
      
      if (fileId || filePath) {
        setAttachedFiles((prev) => prev.filter((f) => {
          if (fileId) return f.file_id !== fileId;
          if (filePath) return f.path !== filePath;
          return true;
        }));
      }
      
      if (emailId) {
        setAttachedEmails((prev) => prev.filter((e) => e.id !== emailId));
      }
    };
    window.addEventListener('workspace-tab-closed', handler as EventListener);
    return () => window.removeEventListener('workspace-tab-closed', handler as EventListener);
  }, []);

  // Persist tool preferences to localStorage
  useEffect(() => {
    try {
      // Always force langgraph_mode to true when saving
      const prefsToSave = { ...toolPreferences, langgraph_mode: true } as any;
      // Ensure legacy 'browserbase' mirrors the new 'browser' for backwards compatibility
      prefsToSave.browserbase = Boolean(toolPreferences.browser);
      localStorage.setItem("toolPreferences", JSON.stringify(prefsToSave));
    } catch {}
  }, [toolPreferences]);

  // Listen for storage events to sync tool preferences from other components (e.g., settings modal)
  useEffect(() => {
    const handleStorageChangeEvent = () => {
      handleStorageChange({ setToolPreferences });
    };

    // Listen for storage events (both native cross-tab and custom same-tab events)
    window.addEventListener('storage', handleStorageChangeEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChangeEvent);
    };
  }, []);

  // Listen for switch-to-agent-mode events (e.g., when running a plan)
  useEffect(() => {
    const handleSwitchToAgentMode = () => {
      setToolPreferences(prev => ({ ...prev, plan_mode: false, ask_mode: false }));
    };

    window.addEventListener('assistant-switch-to-agent-mode', handleSwitchToAgentMode);

    return () => {
      window.removeEventListener('assistant-switch-to-agent-mode', handleSwitchToAgentMode);
    };
  }, []);

  // Pre-download spreadsheet, canvas, and presentation blobs and cache as base64 + mimeType (size-capped)
  useEffect(() => {
    fetchMissingPayloadsHandler({
      attachedFiles,
      attachmentPayloads,
      setAttachmentPayloads,
    });
  }, [attachedFiles, attachmentPayloads]);

  return (
    <ThreadPrimitive.Root
      key={threadKey}
      className="flex h-full flex-col min-h-0"
      style={{
        ["--thread-max-width" as string]: "48rem",
        ["--thread-padding-x" as string]: "1rem",
        backgroundColor: 'transparent',
      }}
    >
      <ThreadPrimitive.Viewport className={cn(styles.darkScrollbar, "relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden min-h-0 pt-4") } style={{ height: '100%', maxHeight: '100%' }}>
        {loadedMessagesBuffer ? null : <ThreadWelcome />}

        {/* Fallback buffer messages (shown only if runtime hasn't hydrated yet) */}
        {loadedMessagesBuffer && (
          <div className="space-y-4">
            {loadedMessagesBuffer.map((message: any, index: number) => (
              <div key={message.id || index} className="mx-auto max-w-[var(--thread-max-width)] px-[var(--thread-padding-x)]">
                {message.role === 'user' ? (
                  <div className="mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto text-sm grid-cols-[minmax(72px,1fr)_auto] gap-y-1 py-4 [&:where(>*)]:col-start-2">
                    <div className="bg-muted text-foreground col-start-2 rounded-md px-5 py-2.5 break-words overflow-x-auto max-w-full">
                      <Typography variant="small" className="whitespace-pre-wrap">
                        {Array.isArray(message.content)
                          ? message.content.map((part: any) => part.type === 'text' ? part.text : '').join('')
                          : ''}
                      </Typography>
                    </div>
                  </div>
                ) : (
                  <div className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[1fr] grid-rows-[auto_1fr] py-1">
                    <Typography variant="small" className="col-start-1 row-start-1 leading-none break-words overflow-x-auto max-w-full">
                      <div className="whitespace-pre-wrap">
                        {Array.isArray(message.content)
                          ? message.content.map((part: any) => part.type === 'text' ? part.text : '').join('')
                          : ''}
                      </div>
                    </Typography>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
            ToolUI,
          }}
        />

        <StreamingStatus />

        <ThreadPrimitive.If empty={false}>
          <motion.div className="min-h-6 min-w-6 shrink-0" />
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <Composer
        dynamicModelsCatalogRevision={dynamicModelsCatalogRevision}
        attachedFiles={attachedFiles}
        attachedEmails={attachedEmails}
        composerAutofocus={composerAutofocus}
        onFileAttach={handleFileAttach}
        onFileRemove={handleFileRemove}
        onEmailAttach={handleEmailAttach}
        onEmailRemove={handleEmailRemove}
        userInfo={userInfo}
        toolPreferences={toolPreferences}
        onUpdateToolPreferences={(prefs) => setToolPreferences(deriveToolPreferences(prefs))}
        attachmentPayloads={attachmentPayloads}
        onAttachmentPayload={handleAttachmentPayload}
        onFileView={handleDrawioFileView}
        pendingChanges={pendingChanges}
        onAcceptAll={handleAcceptAll}
        onRejectAll={handleRejectAll}
        onOpenFile={handleOpenFile}
        messageBuffer={loadedMessagesBuffer}
        assistantTabId={assistantTabId}
        queuedMessages={queuedMessages}
        onQueueMessage={handleQueueMessage}
        onRemoveQueuedMessage={handleRemoveQueuedMessage}
        onMoveQueuedMessageToFront={handleMoveQueuedMessageToFront}
        onSendNextQueued={handleSendNextQueued}
      />

      {/* Conversation Dialogs */}
      <SaveConversationDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={saveCurrentConversation}
        title={conversationTitle}
        onTitleChange={setConversationTitle}
      />
      
      <LoadConversationDialog
        open={showConversationDialog}
        onClose={() => setShowConversationDialog(false)}
        conversations={conversations}
        onLoadConversation={loadConversation}
        onDeleteConversation={deleteConversation}
      />

      {/* Draw.io Viewer Modal */}
      <DrawioViewerModal
        isOpen={drawioModalOpen}
        onClose={handleDrawioModalClose}
        file={selectedDrawioFile}
      />
    </ThreadPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)]">
      <ComposerPrimitive.Root className="bg-muted ml-auto flex w-full max-w-7/8 flex-col rounded-xl">
        <ComposerPrimitive.Input
          className="text-foreground flex min-h-[60px] w-full resize-none bg-transparent p-4 outline-none"
          autoFocus
        />

        <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" aria-label="Cancel edit">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" aria-label="Update message">
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
};


