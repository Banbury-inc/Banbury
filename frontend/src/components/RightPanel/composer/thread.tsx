import * as AssistantUI from "@assistant-ui/react";
import { motion } from "framer-motion";
import {
  CopyIcon,
  CheckIcon,
  PencilIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Volume2,
  VolumeX,
  FolderOpen,
  Trash2,
  Mail,
} from "lucide-react";
import { useState, useEffect } from "react";

import { DocumentAITool } from "../../DocumentAITool";
import { DocxAITool } from "../../DocxAITool";
import { TldrawAITool } from "../../TldrawAITool";
import { DrawioAITool } from "../../MiddlePanel/CanvasViewer/DrawioAITool";
import DrawioViewerModal from "../../MiddlePanel/CanvasViewer/DrawioViewerModal";
import { FileAttachmentDisplay } from "../../file-attachment-display";
import { MarkdownText } from "../markdown-text";
import { SheetAITool } from "../../SheetAITool";
import { TiptapAITool } from "../../TiptapAITool";
import { ToolFallback } from "../tool-fallback";
import { TooltipIconButton } from "../tooltip-icon-button";
import { Button } from "../../ui/button";
import { WebSearchTool } from "../web-search-result";
import { handleDocxAIResponse } from "../handlers/handle-docx-ai-response";
import { handleTldrawAIResponse } from "../handlers/handle-tldraw-ai-response";
import { ToolUI } from "../ToolUI";
import { BrowserTool } from "../../MiddlePanel/BrowserViewer/BrowserTool";
import { ApiService } from "../../../services/apiService";
import { ConversationService } from "../../../services/conversationService";
import { useToast } from "../../ui/use-toast";
import styles from "../../../styles/scrollbar.module.css";
import { cn } from "../../../utils";
import { FileSystemItem } from "../../../utils/fileTreeUtils";
import { createHandleDrawioFileView } from "../handlers/handle-drawio-file-view";
import { Composer } from "./Composer";

import type { FC } from "react";
import { Typography } from "../../ui/typography";


// Destructure Assistant UI primitives from namespace import to avoid named import type issues
const {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ErrorPrimitive,
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
}

export const Thread: FC<ThreadProps> = ({ userInfo, selectedFile, selectedEmail, onEmailSelect }) => {
  const { toast } = useToast();
  const [attachedFiles, setAttachedFiles] = useState<FileSystemItem[]>([]);
  const [attachedEmails, setAttachedEmails] = useState<any[]>([]);
  const [drawioModalOpen, setDrawioModalOpen] = useState(false);
  const [selectedDrawioFile, setSelectedDrawioFile] = useState<FileSystemItem | null>(null);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Array<{ id: string; type: string; description: string }>>([]);
  const [toolPreferences, setToolPreferences] = useState<{ web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean; browser: boolean; x_api: boolean }>(() => {
    try {
      const saved = localStorage.getItem("toolPreferences");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Always force langgraph_mode to true; map legacy 'browserbase' to new 'browser' (default OFF)
        const mappedBrowser = (typeof parsed.browser === 'boolean') ? parsed.browser : (typeof parsed.browserbase === 'boolean' ? Boolean(parsed.browserbase) : false);
        // Return only supported keys to drop legacy fields like 'browserbase' and 'tiptap_ai'
        return {
          web_search: parsed.web_search !== false,
          tiptap_ai: parsed.tiptap_ai !== false,
          read_file: parsed.read_file !== false,
          gmail: parsed.gmail !== false,
          langgraph_mode: true,
          browser: mappedBrowser,
          x_api: typeof parsed.x_api === 'boolean' ? parsed.x_api : false,
        };
      }
    } catch {}
    return { web_search: true, tiptap_ai: true, read_file: true, gmail: true, langgraph_mode: true, browser: false, x_api: false };
  });

  // Cache of pre-downloaded attachment payloads keyed by fileId
  const [attachmentPayloads, setAttachmentPayloads] = useState<Record<string, { fileData: string; mimeType: string }>>({});
  // Force rebind of thread UI when loading external conversations
  const [threadKey, setThreadKey] = useState<number>(0);
  // Fallback render buffer shown with Assistant UI primitives if runtime won't hydrate
  const [loadedMessagesBuffer, setLoadedMessagesBuffer] = useState<any[] | null>(null);

  // Conversation management state
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  
  // (removed custom loaded conversation state)

  const handleFileAttach = (file: FileSystemItem) => {
    setAttachedFiles(prev => [...prev, file]);
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

  const toggleWebSearch = () => {
    setIsWebSearchEnabled(prev => !prev);
    setToolPreferences(prev => ({ ...prev, web_search: !prev.web_search }));
  };

  // Conversation management functions
  const tryApplyMessagesToRuntime = async (rt: any, msgs: any[]): Promise<{ ok: boolean; path: string; count: number }> => {
    const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
    const check = (): number => {
      try {
        const s1 = Array.isArray(rt?.messages) ? rt.messages.length : 0;
        const s2 = Array.isArray(rt?._threadBinding?.getState?.()?.messages) ? rt._threadBinding.getState().messages.length : 0;
        const s3 = Array.isArray(rt?.getState?.()?.messages) ? rt.getState().messages.length : 0;
        return Math.max(s1, s2, s3);
      } catch { return 0; }
    };

    // Disable runtime to prevent auto-runs while importing history
    let didDisable = false;
    let originalState: any = undefined;
    try {
      if (rt?._threadBinding?.getState && rt?._threadBinding?.setState) {
        originalState = rt._threadBinding.getState();
        rt._threadBinding.setState({ ...originalState, isDisabled: true, isLoading: false });
        didDisable = true;
      }
    } catch {}

    // Attempt 1: export snapshot → replace → import
    try {
      const snapshot = rt.export ? await rt.export() : {};
      if (snapshot?.thread && Array.isArray(snapshot.thread.messages)) {
        snapshot.thread.messages = msgs;
      } else {
        snapshot.messages = msgs;
      }
      if (rt.import) {
        await rt.import(snapshot);
        await pause(50);
        const cnt = check();
        if (cnt > 0) {
          try { rt.cancelRun?.(); } catch {}
          // restore disabled state before returning
          try {
            if (didDisable && rt?._threadBinding?.setState) {
              const prevNow = rt?._threadBinding?.getState?.() || {};
              const restoreDisabled = originalState?.isDisabled ?? false;
              rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
            }
          } catch {}
          return { ok: true, path: 'export/import', count: cnt };
        }
      }
    } catch {}

    // Attempt 2: simple import with messages
    try {
      if (rt.import) {
        await rt.import({ messages: msgs });
        await pause(50);
        const cnt = check();
        if (cnt > 0) {
          try { rt.cancelRun?.(); } catch {}
          try {
            if (didDisable && rt?._threadBinding?.setState) {
              const prevNow = rt?._threadBinding?.getState?.() || {};
              const restoreDisabled = originalState?.isDisabled ?? false;
              rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
            }
          } catch {}
          return { ok: true, path: 'import(messages)', count: cnt };
        }
      }
    } catch {}

    // Attempt 3: threadBinding import
    try {
      if (rt._threadBinding?.import) {
        await rt._threadBinding.import({ messages: msgs });
        await pause(50);
        const cnt = check();
        if (cnt > 0) {
          try { rt.cancelRun?.(); } catch {}
          try {
            if (didDisable && rt?._threadBinding?.setState) {
              const prevNow = rt?._threadBinding?.getState?.() || {};
              const restoreDisabled = originalState?.isDisabled ?? false;
              rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
            }
          } catch {}
          return { ok: true, path: '_threadBinding.import', count: cnt };
        }
      }
    } catch {}

    // Attempt 4: setState on threadBinding
    try {
      if (rt._threadBinding?.setState) {
        const prev = rt._threadBinding.getState?.() || {};
        rt._threadBinding.setState({ ...prev, messages: msgs });
        await pause(50);
        const cnt = check();
        if (cnt > 0) {
          try { rt.cancelRun?.(); } catch {}
          try {
            if (didDisable && rt?._threadBinding?.setState) {
              const prevNow = rt?._threadBinding?.getState?.() || {};
              const restoreDisabled = originalState?.isDisabled ?? false;
              rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
            }
          } catch {}
          return { ok: true, path: '_threadBinding.setState', count: cnt };
        }
      }
    } catch {}

    // Attempt 5: temporarily disable runtime, append one-by-one (best-effort)
    try {
      if (rt.append) {
        try {
          // Disable runtime actions to avoid triggering runs while reconstructing history
          const prev = rt._threadBinding?.getState?.() || {};
          rt._threadBinding?.setState?.({ ...prev, isDisabled: true, isLoading: false });
        } catch {}
        for (const m of msgs) {
          try { await rt.append(m); } catch {}
        }
        try {
          const prev2 = rt._threadBinding?.getState?.() || {};
          rt._threadBinding?.setState?.({ ...prev2, isDisabled: false, isLoading: false });
        } catch {}
        await pause(50);
        const cnt = check();
        if (cnt > 0) {
          try { rt.cancelRun?.(); } catch {}
          try {
            if (didDisable && rt?._threadBinding?.setState) {
              const prevNow = rt?._threadBinding?.getState?.() || {};
              const restoreDisabled = originalState?.isDisabled ?? false;
              rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
            }
          } catch {}
          return { ok: true, path: 'append(each)', count: cnt };
        }
      }
    } catch {}

    // Restore runtime disabled state
    try {
      if (didDisable && rt?._threadBinding?.setState) {
        const prevNow = rt?._threadBinding?.getState?.() || {};
        const restoreDisabled = originalState?.isDisabled ?? false;
        rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
      }
    } catch {}

    return { ok: false, path: 'failed', count: 0 };
  };
  const loadConversations = async () => {
    if (!userInfo?.username) return;
    
    setIsLoadingConversations(true);
    try {
      const result = await ConversationService.getConversations();
      if (result.success && result.conversations) {
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const saveCurrentConversation = async () => {
    if (!userInfo?.username || !conversationTitle.trim()) return;
    
    try {
      // Get current messages from the thread runtime
      const messages = runtime.messages || [];
      
      // Check if we have any messages to save
      if (messages.length === 0) {
        return;
      }
      
              const result = await ConversationService.saveConversation({
          title: conversationTitle,
          messages: messages,
          metadata: {
            attachedFiles: attachedFiles.map(f => ({ id: f.file_id, name: f.name })),
            attachedEmails: attachedEmails.map(e => ({ id: e.id, subject: e.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject' })),
            toolPreferences,
          }
        });
      
      if (result.success) {
        setSaveDialogOpen(false);
        setConversationTitle("");
        await loadConversations();
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const result = await ConversationService.getConversation(conversationId);
      if (!result.success || !result.conversation) return;

      const conversation = result.conversation;
      console.log('Loading conversation:', conversation);

      // Prepare attachments and tool preferences
      if (conversation.metadata?.attachedFiles) {
        const files = conversation.metadata.attachedFiles;
        const fileItems: FileSystemItem[] = files.map((file: any) => ({
          id: file.id,
          file_id: file.id,
          name: file.name,
          path: '',
          type: 'file',
          size: 0,
          modified: new Date(),
          s3_url: ''
        }));
        setAttachedFiles(fileItems);
      }
      if (conversation.metadata?.attachedEmails) {
        // Note: We can't fully restore emails from metadata alone
        // The emails would need to be re-fetched from Gmail API
        // For now, we'll just clear the attached emails
        setAttachedEmails([]);
      }
      if (conversation.metadata?.toolPreferences) {
        setToolPreferences(conversation.metadata.toolPreferences);
      }

      if (!runtime) return;

      // Reset runtime before applying messages
      runtime.reset();

      const rawMessages = Array.isArray(conversation.messages) ? conversation.messages : [];

      const sanitizedMessages = rawMessages.map((msg: any, index: number) => {
        const baseId = msg.id || `msg-${index}-${Date.now()}`;
        const parts = Array.isArray(msg.content)
          ? msg.content
          : (typeof msg.content === 'string' && msg.content.length > 0
              ? [{ type: 'text', text: msg.content }]
              : []);
        return {
          id: baseId,
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: parts,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        };
      });

      // Pre-set buffer so user sees messages even if runtime import lags
      setLoadedMessagesBuffer(sanitizedMessages);

      // Dispatch an event to the runtime provider to ensure we import within its context
      try {
        window.dispatchEvent(new CustomEvent('assistant-load-conversation', { detail: { messages: sanitizedMessages } }));
        // Give the runtime a moment and then verify
        setTimeout(() => {
          const count = Array.isArray((runtime as any)?.messages) ? (runtime as any).messages.length : 0;
          if (count > 0) {
            setThreadKey(Date.now());
            setLoadedMessagesBuffer(null);
            setShowConversationDialog(false);
          } else {
            // Fallback to direct application if provider path didn’t stick
            tryApplyMessagesToRuntime(runtime as any, sanitizedMessages as any).then((applied) => {
              if (applied.ok) {
                setThreadKey(Date.now());
                setLoadedMessagesBuffer(null);
                setShowConversationDialog(false);
              } else {
              }
            });
          }
        }, 150);
      } catch (e) {
        // If dispatch fails, fallback immediately
        const applied = await tryApplyMessagesToRuntime(runtime as any, sanitizedMessages as any);
        if (applied.ok) {
          setThreadKey(Date.now());
          setLoadedMessagesBuffer(null);
          setShowConversationDialog(false);
        } else {
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const result = await ConversationService.deleteConversation(conversationId);
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
      // Check if the file is already attached
      const isAlreadyAttached = attachedFiles.some(f => f.file_id === selectedFile.file_id);
      
      if (!isAlreadyAttached) {
        // Only attach if it's a viewable file type (aligned with Workspaces)
        const isViewableFile = (fileName: string): boolean => {
          const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
          const documentExtensions = ['.docx', '.doc', '.pdf'];
          const spreadsheetExtensions = ['.csv', '.xlsx', '.xls'];
          const canvasExtensions = ['.tldraw'];
          const codeExtensions = [
            '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
            '.html', '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash', '.zsh', '.fish',
            '.sql', '.r', '.m', '.mat', '.ipynb', '.jl', '.dart', '.lua', '.pl', '.pm', '.tcl', '.vbs', '.ps1', '.bat', '.cmd', '.coffee', '.litcoffee', '.iced',
            '.md', '.markdown', '.tex', '.rtex', '.bib', '.vue', '.svelte'
          ];
          const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
          return [...imageExtensions, ...documentExtensions, ...spreadsheetExtensions, ...canvasExtensions, ...codeExtensions].includes(extension);
        };
        
        if (isViewableFile(selectedFile.name)) {
          setAttachedFiles(prev => [selectedFile, ...prev]);
        }
      }
    }
  }, [selectedFile, attachedFiles]);

  // Auto-attach the selected email from Email tab
  useEffect(() => {
    if (selectedEmail && selectedEmail.id) {
      // Check if the email is already attached
      const isAlreadyAttached = attachedEmails.some(e => e.id === selectedEmail.id);
      
      if (!isAlreadyAttached) {
        setAttachedEmails(prev => [selectedEmail, ...prev]);
      }
    }
  }, [selectedEmail, attachedEmails]);

  // Get the thread runtime at the component level
  const runtime = useThreadRuntime();

  // Auto-save conversation when langgraph stream completes
  useEffect(() => {
    if (!runtime || !userInfo?.username) {
      return;
    }
    
    const handleRunEnd = async () => {
      console.log('🔄 Auto-save triggered');
      
      // Wait a bit for messages to be processed and added to runtime
      const waitForMessages = async (maxAttempts = 10) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          // Try different ways to access messages
          const messages1 = runtime.messages || [];
          const messages2 = runtime?._threadBinding?.getState?.()?.messages || [];
          const messages3 = runtime?.getState?.()?.messages || [];
          
          const messages = messages1.length > 0 ? messages1 : messages2.length > 0 ? messages2 : messages3;
          
          if (messages.length > 0) {
            return messages;
          }
          
          // Wait 500ms before next attempt
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        return [];
      };
      
      try {
        const messages = await waitForMessages();
        
        // Only auto-save if we have messages
        if (messages.length === 0) {
          console.log('❌ No messages to save');
          return;
        }
        
        // Find the first user message to use as title
        const firstUserMessage = messages.find((msg: any) => msg.role === 'user');
        console.log('👤 First user message found:', !!firstUserMessage);
        if (!firstUserMessage) {
          console.log('❌ No user message found');
          return;
        }
        
        // Extract text content from the first user message
        let title = 'New Conversation';
        if (firstUserMessage.content && Array.isArray(firstUserMessage.content)) {
          const textContent = firstUserMessage.content
            .filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join(' ')
            .trim();
          
          if (textContent) {
            // Truncate title to reasonable length
            title = textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent;
          }
        }
        
        // Check if this conversation already exists (by comparing first user message)
        const existingConversation = conversations.find(conv => {
          if (!conv.messages || conv.messages.length === 0) return false;
          const convFirstUserMsg = conv.messages.find((msg: any) => msg.role === 'user');
          if (!convFirstUserMsg) return false;
          
          // Compare the first user message content
          const convTextContent = convFirstUserMsg.content
            ?.filter((part: any) => part.type === 'text')
            ?.map((part: any) => part.text)
            ?.join(' ')
            ?.trim();
          
          const currentTextContent = firstUserMessage.content
            ?.filter((part: any) => part.type === 'text')
            ?.map((part: any) => part.text)
            ?.join(' ')
            ?.trim();
          
          return convTextContent === currentTextContent;
        });
        
        console.log('🔍 Checking for existing conversation...');
        if (existingConversation) {
          console.log('📝 Updating existing conversation:', existingConversation._id);
                  // Update existing conversation
        const result = await ConversationService.updateConversation(existingConversation._id, {
          title,
          messages,
          metadata: {
            attachedFiles: attachedFiles.map(f => ({ id: f.file_id, name: f.name })),
            attachedEmails: attachedEmails.map(e => ({ id: e.id, subject: e.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject' })),
            toolPreferences,
            lastUpdated: new Date().toISOString()
          }
        });
          
          if (result.success) {
            console.log('Conversation auto-updated:', existingConversation._id);
          }
        } else {
          console.log('🆕 Creating new conversation');
          // Create new conversation
          const result = await ConversationService.saveConversation({
            title,
            messages,
            metadata: {
              attachedFiles: attachedFiles.map(f => ({ id: f.file_id, name: f.name })),
              attachedEmails: attachedEmails.map(e => ({ id: e.id, subject: e.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject' })),
              toolPreferences,
              createdAt: new Date().toISOString()
            }
          });
          
          if (result.success) {
            console.log('Conversation auto-saved:', result.conversation_id);
            await loadConversations();
          }
        }
      } catch (error) {
        console.error('Error auto-saving conversation:', error);
      }
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
      const msgs = customEvent.detail?.messages;
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
  }, [runtime]);

  // Listen for clear-conversation events to reset the conversation
  useEffect(() => {
    const handler = (event: Event) => {
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
  }, [runtime]);

  // Load conversations on mount
  useEffect(() => {
    if (userInfo?.username) {
      loadConversations();
    }
  }, [userInfo?.username]);

  // Track pending changes from AI tools
  useEffect(() => {
    const handleChangeRegistered = (event: CustomEvent) => {
      const { id, type, description } = event.detail;
      setPendingChanges(prev => {
        // Avoid duplicates
        if (prev.some(c => c.id === id)) return prev;
        return [...prev, { id, type, description }];
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

  // Listen for DOCX AI response events
  useEffect(() => {
    const handleDocxResponse = (event: CustomEvent) => {
      handleDocxAIResponse(event.detail);
    };

    window.addEventListener('docx-ai-response', handleDocxResponse as EventListener);
    return () => window.removeEventListener('docx-ai-response', handleDocxResponse as EventListener);
  }, []);

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
    try {
      const simplifiedFiles = attachedFiles.map((f) => ({
        fileId: f.file_id,
        fileName: f.name,
        filePath: f.path,
        ...(f.file_id && attachmentPayloads[f.file_id]
          ? { fileData: attachmentPayloads[f.file_id].fileData, mimeType: attachmentPayloads[f.file_id].mimeType }
          : {}),
      }));
      
      const simplifiedEmails = attachedEmails.map((e) => ({
        emailId: e.id,
        subject: e.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject',
        from: e.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown',
        snippet: e.snippet || '',
        threadId: e.threadId,
        internalDate: e.internalDate,
        payload: e.payload
      }));
      
      localStorage.setItem('pendingAttachments', JSON.stringify(simplifiedFiles));
      localStorage.setItem('pendingEmailAttachments', JSON.stringify(simplifiedEmails));
    } catch {
      // ignore storage errors
    }
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

  // Persist tool preferences and keep web search toggle in sync with menu
  useEffect(() => {
    try {
      // Always force langgraph_mode to true when saving
      const prefsToSave = { ...toolPreferences, langgraph_mode: true } as any;
      // Ensure legacy 'browserbase' mirrors the new 'browser' for backwards compatibility
      prefsToSave.browserbase = Boolean(toolPreferences.browser);
      localStorage.setItem("toolPreferences", JSON.stringify(prefsToSave));
    } catch {}
    if (isWebSearchEnabled !== toolPreferences.web_search) {
      setIsWebSearchEnabled(toolPreferences.web_search);
    }
  }, [toolPreferences, isWebSearchEnabled]);

  // Pre-download spreadsheet and canvas blobs and cache as base64 + mimeType (size-capped)
  useEffect(() => {
    const isSpreadsheet = (fileName: string) => {
      const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      return ['.csv', '.xlsx', '.xls'].includes(ext);
    };

    const isTldrawCanvas = (fileName: string) => {
      const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      return ext === '.tldraw';
    };

    const blobToBase64 = (blob: Blob): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          // Strip data URL prefix if present
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

    const fetchMissingPayloads = async () => {
      const tasks = attachedFiles
        .filter((f) => f.file_id && (isSpreadsheet(f.name) || isTldrawCanvas(f.name)) && !attachmentPayloads[f.file_id])
        .map(async (f) => {
          try {
            const res = await ApiService.downloadS3File(f.file_id!, f.name);
            if (res?.success && res.blob) {
              // Skip embedding if blob exceeds ~600KB to keep request under server limit after base64 overhead
              const approxSize = res.blob.size;
              if (approxSize > 600 * 1024) return;
              const base64 = await blobToBase64(res.blob);
              let mimeType = res.blob.type;
              if (!mimeType) {
                if (f.name.toLowerCase().endsWith('.csv')) {
                  mimeType = 'text/csv';
                } else if (f.name.toLowerCase().endsWith('.tldraw')) {
                  mimeType = 'application/json';
                } else {
                  mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                }
              }
              setAttachmentPayloads((prev) => ({ ...prev, [f.file_id!]: { fileData: base64, mimeType } }));
            }
          } catch {}
        });
      if (tasks.length > 0) {
        await Promise.allSettled(tasks);
      }
    };

    fetchMissingPayloads();
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
      <ThreadPrimitive.Viewport className={cn(styles.darkScrollbar, "relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden min-h-0") } style={{ height: '100%', maxHeight: '100%' }}>
        {loadedMessagesBuffer ? null : <ThreadWelcome />}

        {/* Fallback buffer messages (shown only if runtime hasn't hydrated yet) */}
        {loadedMessagesBuffer && (
          <div className="space-y-4">
            {loadedMessagesBuffer.map((message: any, index: number) => (
              <div key={message.id || index} className="mx-auto max-w-[var(--thread-max-width)] px-[var(--thread-padding-x)]">
                {message.role === 'user' ? (
                  <div className="mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto text-sm grid-cols-[minmax(72px,1fr)_auto] gap-y-1 py-4 [&:where(>*)]:col-start-2">
                    <div className="bg-muted text-foreground col-start-2 rounded-3xl px-5 py-2.5 break-words overflow-x-auto max-w-full">
                      <div className="whitespace-pre-wrap">
                        {Array.isArray(message.content)
                          ? message.content.map((part: any) => part.type === 'text' ? part.text : '').join('')
                          : ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[1fr] grid-rows-[auto_1fr] py-1">
                    <div className="text-zinc-900 dark:text-white col-start-1 row-start-1 leading-none break-words text-sm overflow-x-auto max-w-full">
                      <div className="whitespace-pre-wrap">
                        {Array.isArray(message.content)
                          ? message.content.map((part: any) => part.type === 'text' ? part.text : '').join('')
                          : ''}
                      </div>
                    </div>
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
        attachedFiles={attachedFiles}
        attachedEmails={attachedEmails}
        onFileAttach={handleFileAttach}
        onFileRemove={handleFileRemove}
        onEmailAttach={handleEmailAttach}
        onEmailRemove={handleEmailRemove}
        userInfo={userInfo}
        isWebSearchEnabled={isWebSearchEnabled}
        onToggleWebSearch={toggleWebSearch}
        toolPreferences={toolPreferences}
        onUpdateToolPreferences={(prefs) => setToolPreferences(prefs)}
        attachmentPayloads={attachmentPayloads}
        onAttachmentPayload={handleAttachmentPayload}
        onFileView={handleDrawioFileView}
        pendingChanges={pendingChanges}
        onAcceptAll={handleAcceptAll}
        onRejectAll={handleRejectAll}
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

const ThreadWelcome: FC = () => {
  // Always show LangGraph mode as active
  const toolPreferences = { langgraph_mode: true };

  return (
    <ThreadPrimitive.Empty>
      <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col px-[var(--thread-padding-x)]">
        <div className="flex w-full flex-grow flex-col items-center justify-center">
          <div className="flex size-full flex-col justify-center px-8 md:mt-20">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.5 }}
            >
              <Typography variant="h2">Hello there!</Typography>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.6 }}
            >
              <Typography variant="p">How can I help you today?</Typography>
            </motion.div>
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="border-destructive bg-destructive/10 dark:bg-destructive/5 text-destructive mt-2 rounded-md border p-3 text-sm dark:text-red-200">
        <ErrorPrimitive.Message className="line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const StreamingStatus: FC = () => {
  const runtime = useThreadRuntime();
  const [statusDetails, setStatusDetails] = useState<any>(null);

  useEffect(() => {
    // Listen for status changes from the runtime
    const updateStatus = () => {
      try {
        const lastMessage = runtime.messages[runtime.messages.length - 1];
        if (lastMessage?.status?.details) {
          setStatusDetails(lastMessage.status.details);
        } else {
          setStatusDetails(null);
        }
      } catch (e) {
        // Ignore errors accessing runtime
      }
    };

    // Subscribe to runtime changes if possible
    updateStatus();
    
    // Set up a polling interval to check for status updates
    const interval = setInterval(updateStatus, 100);
    
    return () => clearInterval(interval);
  }, [runtime]);

  if (!statusDetails) return null;

  return (
    <ThreadPrimitive.If running>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="mx-auto max-w-[var(--thread-max-width)] px-[var(--thread-padding-x)] mb-4"
      >
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3">
          {statusDetails.thinking && (
            <div className="flex items-center text-blue-700 dark:text-blue-300 text-sm mb-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              {statusDetails.thinking}
            </div>
          )}
          
          {statusDetails.step && statusDetails.totalSteps && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 mb-1">
                <span>Step {statusDetails.step} of {statusDetails.totalSteps}</span>
                <span>{Math.round(statusDetails.progress || 0)}%</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800/30 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${statusDetails.progress || 0}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {statusDetails.toolStatus && (
            <div className="flex items-center text-green-600 dark:text-green-400 text-xs">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              <span className="font-medium">{statusDetails.toolStatus.tool}:</span>
              <span className="ml-1">{statusDetails.toolStatus.message}</span>
            </div>
          )}
          
          {statusDetails.toolCompleted && (
            <div className="flex items-center text-green-600 dark:text-green-400 text-xs">
              <CheckIcon className="w-3 h-3 mr-2" />
              <span className="font-medium">{statusDetails.toolCompleted.tool}:</span>
              <span className="ml-1">{statusDetails.toolCompleted.message}</span>
            </div>
          )}
        </div>
      </motion.div>
    </ThreadPrimitive.If>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[1fr] grid-rows-[auto_1fr] px-[var(--thread-padding-x)] py-1"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="assistant"
      >
        <div className="text-zinc-900 dark:text-white col-start-1 row-start-1 leading-none break-words text-sm overflow-x-auto max-w-full">
          <MessagePrimitive.Content
            components={{
              Text: MarkdownText,
                tools: { 
                by_name: {
                  web_search: WebSearchTool,
                  tiptap_ai: TiptapAITool,
                  sheet_ai: SheetAITool,
                  docx_ai: DocxAITool,
                  tldraw_ai: TldrawAITool,
                  drawio_ai: DrawioAITool,
                  document_ai: DocumentAITool,
                  browser: BrowserTool,
                },
                Fallback: ToolFallback 
              },
            }}
          />
          <MessageError />
        </div>

        <AssistantActionBar />

        <BranchPicker className="col-start-1 row-start-2" />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-muted-foreground data-floating:bg-background col-start-3 row-start-2 mt-3 ml-3 flex gap-1 data-floating:absolute data-floating:mt-2 data-floating:rounded-md data-floating:border data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <VoiceControls />
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const VoiceControls: FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const extractMessageText = (el: HTMLElement | null) => {
    if (!el) return '';
    // Fallback: innerText of message root
    return (el.innerText || '').trim();
  };

  const handleSpeak = (e: React.MouseEvent) => {
    const synth = (typeof window !== 'undefined') ? window.speechSynthesis : null;
    if (!synth) return;
    if (synth.speaking) {
      synth.cancel();
    }
    const root = (e.currentTarget as HTMLElement).closest('[data-role="assistant"]') as HTMLElement | null;
    const text = extractMessageText(root);
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utter);
  };

  const handleStop = () => {
    const synth = (typeof window !== 'undefined') ? window.speechSynthesis : null;
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
  };

  const hasTts = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (!hasTts) return null;

  return (
    <div className="flex items-center gap-1">
      {!isSpeaking ? (
        <TooltipIconButton tooltip="Play audio" onClick={handleSpeak}>
          <Volume2 />
        </TooltipIconButton>
      ) : (
        <TooltipIconButton tooltip="Stop audio" onClick={handleStop}>
          <VolumeX />
        </TooltipIconButton>
      )}
    </div>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        className="mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto text-sm grid-cols-[minmax(72px,1fr)_auto] gap-y-1 px-[var(--thread-padding-x)] py-4 [&:where(>*)]:col-start-2"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="user"
      >
        <UserActionBar />

        <div className="bg-muted text-foreground col-start-2 rounded-3xl px-5 py-2.5 break-words overflow-x-auto max-w-full">
          <MessagePrimitive.Content components={{ Text: MarkdownText }} />
          
          {/* Display attached files */}
          <MessagePrimitive.Attachments>
            {(attachments: any[]) => {
              const fileAttachments = attachments.filter((att: any) => att.type === 'file');
              const emailAttachments = attachments.filter((att: any) => att.type === 'email');
              
              return (
                <div className="space-y-2">
                  {fileAttachments.length > 0 && (
                    <FileAttachmentDisplay 
                      files={fileAttachments.map((att: any) => ({
                        id: att.fileId,
                        file_id: att.fileId,
                        name: att.fileName,
                        path: att.filePath,
                        type: 'file'
                      }))}
                    />
                  )}
                  
                  {emailAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {emailAttachments.map((att: any) => (
                        <div
                          key={att.emailId}
                          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                          title={`From: ${att.from}\nSubject: ${att.subject}`}
                        >
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-32">{att.subject}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          </MessagePrimitive.Attachments>
        </div>

        <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="col-start-1 mt-2.5 mr-3 flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
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

const BranchPicker: FC<any> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn("text-muted-foreground inline-flex items-center text-xs", className)}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const StarIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 0L9.79611 6.20389L16 8L9.79611 9.79611L8 16L6.20389 9.79611L0 8L6.20389 6.20389L8 0Z"
      fill="currentColor"
    />
  </svg>
);

// Conversation Management Components
interface ConversationButtonsProps {
  onSave: () => void;
  onLoad: () => void;
  conversations: any[];
  isLoading: boolean;
}

interface SaveConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  onTitleChange: (title: string) => void;
}

const SaveConversationDialog: FC<SaveConversationDialogProps> = ({ 
  open, 
  onClose, 
  onSave, 
  title, 
  onTitleChange 
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">Save Conversation</h3>
        <input
          type="text"
          placeholder="Enter conversation title..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full p-2 bg-zinc-50 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!title.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

interface LoadConversationDialogProps {
  open: boolean;
  onClose: () => void;
  conversations: any[];
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

const LoadConversationDialog: FC<LoadConversationDialogProps> = ({ 
  open, 
  onClose, 
  conversations, 
  onLoadConversation, 
  onDeleteConversation 
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col shadow-xl border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">Load Conversation</h3>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400 text-center py-8">No saved conversations found.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-zinc-900 dark:text-white">{conversation.title}</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <TooltipIconButton
                      tooltip="Load conversation"
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoadConversation(conversation._id)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </TooltipIconButton>
                    <TooltipIconButton
                      tooltip="Refresh conversation display"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Force a refresh by reloading the conversation
                        onLoadConversation(conversation._id);
                      }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <RefreshCwIcon className="h-4 w-4" />
                    </TooltipIconButton>
                    <TooltipIconButton
                      tooltip="Delete conversation"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteConversation(conversation._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </TooltipIconButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
