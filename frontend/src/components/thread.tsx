import * as AssistantUI from "@assistant-ui/react";
import { motion } from "framer-motion";
import {
  ArrowDownIcon,
  CopyIcon,
  CheckIcon,
  PencilIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Square,
  Globe,
  Wrench,
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { ChatTiptapComposer } from "./ChatTiptapComposer";
import { DocumentAITool } from "./DocumentAITool";
import { FileAttachment } from "./file-attachment";
import { FileAttachmentDisplay } from "./file-attachment-display";
import { MarkdownText } from "./markdown-text";
import { SheetAITool } from "./SheetAITool";
import { TiptapAITool } from "./TiptapAITool";
import { ToolFallback } from "./tool-fallback";
import { TooltipIconButton } from "./tooltip-icon-button";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { WebSearchTool } from "./web-search-result";
  import { ApiService } from "../services/apiService";
import styles from "../styles/scrollbar.module.css";
import { cn } from "../utils";
import { FileSystemItem } from "../utils/fileTreeUtils";

import type { FC } from "react";


// Destructure Assistant UI primitives from namespace import to avoid named import type issues
const {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ErrorPrimitive,
  useComposerRuntime,
  useThreadRuntime,
} = AssistantUI as any;

interface ThreadProps {
  userInfo: {
    username: string;
    email?: string;
  } | null;
  selectedFile?: FileSystemItem | null;
  onEmailSelect?: (email: any) => void;
}

export const Thread: FC<ThreadProps> = ({ userInfo, selectedFile, onEmailSelect }) => {
  const [attachedFiles, setAttachedFiles] = useState<FileSystemItem[]>([]);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(true);
  const [toolPreferences, setToolPreferences] = useState<{ web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean }>(() => {
    try {
      const saved = localStorage.getItem("toolPreferences");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Always force langgraph_mode to true
        return { ...parsed, langgraph_mode: true };
      }
    } catch {}
    return { web_search: true, tiptap_ai: true, read_file: true, gmail: true, langgraph_mode: true };
  });

  // Cache of pre-downloaded attachment payloads keyed by fileId
  const [attachmentPayloads, setAttachmentPayloads] = useState<Record<string, { fileData: string; mimeType: string }>>({});

  const handleFileAttach = (file: FileSystemItem) => {
    setAttachedFiles(prev => [...prev, file]);
  };

  const handleFileRemove = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.file_id !== fileId));
  };

  const toggleWebSearch = () => {
    setIsWebSearchEnabled(prev => !prev);
    setToolPreferences(prev => ({ ...prev, web_search: !prev.web_search }));
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
          const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
          return [...imageExtensions, ...documentExtensions, ...spreadsheetExtensions].includes(extension);
        };
        
        if (isViewableFile(selectedFile.name)) {
          setAttachedFiles(prev => [selectedFile, ...prev]);
        }
      }
    }
  }, [selectedFile, attachedFiles]);

  // Keep a copy of attachments in localStorage so the runtime can inject them
  useEffect(() => {
    try {
      const simplified = attachedFiles.map((f) => ({
        fileId: f.file_id,
        fileName: f.name,
        filePath: f.path,
        ...(f.file_id && attachmentPayloads[f.file_id]
          ? { fileData: attachmentPayloads[f.file_id].fileData, mimeType: attachmentPayloads[f.file_id].mimeType }
          : {}),
      }));
      localStorage.setItem('pendingAttachments', JSON.stringify(simplified));
    } catch {
      // ignore storage errors
    }
  }, [attachedFiles, attachmentPayloads]);

  // Persist tool preferences and keep web search toggle in sync with menu
  useEffect(() => {
    try {
      // Always force langgraph_mode to true when saving
      const prefsToSave = { ...toolPreferences, langgraph_mode: true };
      localStorage.setItem("toolPreferences", JSON.stringify(prefsToSave));
    } catch {}
    if (isWebSearchEnabled !== toolPreferences.web_search) {
      setIsWebSearchEnabled(toolPreferences.web_search);
    }
  }, [toolPreferences, isWebSearchEnabled]);

  // Pre-download spreadsheet blobs and cache as base64 + mimeType (size-capped)
  useEffect(() => {
    const isSpreadsheet = (fileName: string) => {
      const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      return ['.csv', '.xlsx', '.xls'].includes(ext);
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
        .filter((f) => f.file_id && isSpreadsheet(f.name) && !attachmentPayloads[f.file_id])
        .map(async (f) => {
          try {
            const res = await ApiService.downloadS3File(f.file_id!, f.name);
            if (res?.success && res.blob) {
              // Skip embedding if blob exceeds ~600KB to keep request under server limit after base64 overhead
              const approxSize = res.blob.size;
              if (approxSize > 600 * 1024) return;
              const base64 = await blobToBase64(res.blob);
              const mimeType = res.blob.type || (f.name.toLowerCase().endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
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
      className="flex h-full flex-col"
      style={{
        ["--thread-max-width" as string]: "48rem",
        ["--thread-padding-x" as string]: "1rem",
        backgroundColor: 'transparent',
      }}
    >
      <ThreadPrimitive.Viewport className={cn(styles.darkScrollbar, "relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto") }>
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        <StreamingStatus />

        <ThreadPrimitive.If empty={false}>
          <motion.div className="min-h-6 min-w-6 shrink-0" />
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <Composer 
        attachedFiles={attachedFiles}
        onFileAttach={handleFileAttach}
        onFileRemove={handleFileRemove}
        userInfo={userInfo}
        isWebSearchEnabled={isWebSearchEnabled}
        onToggleWebSearch={toggleWebSearch}
        toolPreferences={toolPreferences}
        onUpdateToolPreferences={setToolPreferences}
        attachmentPayloads={attachmentPayloads}
      />
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="dark:bg-background dark:hover:bg-accent absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
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
              className="text-2xl font-semibold"
            >
              Hello there!
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground/65 text-2xl"
            >
              How can I help you today?
            </motion.div>
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      {[
        {
          title: "What are the advantages",
          label: "of using Assistant Cloud?",
          action: "What are the advantages of using Assistant Cloud?",
        },
        {
          title: "Write code to",
          label: `demonstrate topological sorting`,
          action: `Write code to demonstrate topological sorting`,
        },
        {
          title: "Help me write an essay",
          label: `about AI chat applications`,
          action: `Help me write an essay about AI chat applications`,
        },
        {
          title: "What is the weather",
          label: "in San Francisco?",
          action: "What is the weather in San Francisco?",
        },
      ].map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className="[&:nth-child(n+3)]:hidden sm:[&:nth-child(n+3)]:block"
        >
          <ThreadPrimitive.Suggestion
            prompt={suggestedAction.action}
            method="replace"
            autoSend
            asChild
          >
            <Button
              variant="ghost"
              className="dark:hover:bg-accent/60 h-auto w-full flex-1 flex-wrap items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
              aria-label={suggestedAction.action}
            >
              <span className="font-medium">
                {suggestedAction.title}
              </span>
              <p className="text-muted-foreground">
                {suggestedAction.label}
              </p>
            </Button>
          </ThreadPrimitive.Suggestion>
        </motion.div>
      ))}
    </div>
  );
};

interface ComposerProps {
  attachedFiles: FileSystemItem[];
  onFileAttach: (file: FileSystemItem) => void;
  onFileRemove: (fileId: string) => void;
  userInfo: {
    username: string;
    email?: string;
  } | null;
  isWebSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  toolPreferences: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean };
  onUpdateToolPreferences: (prefs: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean }) => void;
  attachmentPayloads: Record<string, { fileData: string; mimeType: string }>;
}

const Composer: FC<ComposerProps> = ({ attachedFiles, onFileAttach, onFileRemove, userInfo, isWebSearchEnabled, onToggleWebSearch, toolPreferences, onUpdateToolPreferences, attachmentPayloads }) => {
  const composer = useComposerRuntime();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Add attachments to the composer when files are attached
  useEffect(() => {
    if (!composer.attachments) return;
    
    if (attachedFiles.length > 0) {
      // Clear existing attachments first
      composer.attachments.clear();
      
      // Add new attachments
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
    } else {
      // Clear attachments when no files are attached
      composer.attachments.clear();
    }
  }, [attachedFiles, composer.attachments, attachmentPayloads]);

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
    
    // Document context is already stored in localStorage by ChatTiptapComposer
    const documentContext = localStorage.getItem('pendingDocumentContext') || '';
      
    if (text.trim().length > 0) {
      // Try multiple approaches to get the text into the composer
      const input = document.querySelector('textarea[aria-label="Message input"]') as HTMLTextAreaElement;
      if (input) {
        // Set the input value and trigger all possible events
        input.value = text; // Keep original text for display
        input.focus();
        
        // Trigger all possible events to ensure detection
        ['input', 'change', 'keyup', 'keydown', 'focus', 'blur'].forEach(eventType => {
          input.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
        
        // Use the composer's setText method with just the chat text
        try {
          if (composer && typeof composer.setText === 'function') {
            composer.setText(text); // Send only chat text for display
          }
        } catch (e) {
          console.error('Error setting composer text:', e);
        }
        
        // Wait and then send
        setTimeout(() => {
          composer.send();
          
          // Clear after sending
          setTimeout(() => {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            if (proseMirrorElement) {
              proseMirrorElement.innerHTML = '<p></p>';
            }
          }, 100);
        }, 100);
      }
    }
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)] pb-4 md:pb-6" style={{ backgroundColor: 'transparent' }}>
      <ThreadScrollToBottom />

      <div className="relative flex w-full flex-col">
        {/* Display attached files above the composer */}
        {attachedFiles.length > 0 && (
          <div className="bg-zinc-800 border-l border-r border-t border-b border-zinc-300 dark:border-zinc-600 rounded-t-2xl px-2 py-0.5">
            <FileAttachmentDisplay 
              files={attachedFiles}
              onFileClick={(file) => onFileRemove(file.file_id!)}
            />
          </div>
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
          <div className={`bg-zinc-800 border-l border-r border-zinc-300 dark:border-zinc-600 ${attachedFiles.length > 0 ? 'border-t-0 rounded-t-none' : 'border-t rounded-t-2xl'}`}>
            <ChatTiptapComposer
              hiddenInputRef={inputRef}
              userInfo={userInfo}
              onFileAttach={onFileAttach}
              placeholder="Send a message..."
              className="min-h-16"
              onSend={handleSend}
            />
          </div>

          <ComposerAction 
            attachedFiles={attachedFiles}
            onFileAttach={onFileAttach}
            onFileRemove={onFileRemove}
            userInfo={userInfo}
            isWebSearchEnabled={isWebSearchEnabled}
            onToggleWebSearch={onToggleWebSearch}
            toolPreferences={toolPreferences}
            onUpdateToolPreferences={onUpdateToolPreferences}
            onSend={handleSend}
          />
        </ComposerPrimitive.Root>
      </div>
    </div>
  );
};

interface ComposerActionProps {
  attachedFiles: FileSystemItem[];
  onFileAttach: (file: FileSystemItem) => void;
  onFileRemove: (fileId: string) => void;
  userInfo: {
    username: string;
    email?: string;
  } | null;
  isWebSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  toolPreferences: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean };
  onUpdateToolPreferences: (prefs: { web_search: boolean; tiptap_ai: boolean; read_file: boolean; gmail: boolean; langgraph_mode: boolean }) => void;
  onSend: () => void;
}

const ComposerAction: FC<ComposerActionProps> = ({ attachedFiles, onFileAttach, onFileRemove, userInfo, isWebSearchEnabled, onToggleWebSearch, toolPreferences, onUpdateToolPreferences, onSend }) => {
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
    <div className="bg-zinc-800 border-l border-r border-b border-zinc-300 dark:border-zinc-600 relative flex items-center justify-between rounded-b-2xl p-2">
      <div className="flex items-center gap-2">
        <FileAttachment
          onFileAttach={onFileAttach}
          attachedFiles={[]}
          onFileRemove={onFileRemove}
          userInfo={userInfo}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded flex items-center justify-center"
              title="Tools"
              aria-label="Tools"
            >
              <Wrench className="h-4 w-4" />
            </button>
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
              checked={toolPreferences.tiptap_ai}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, tiptap_ai: Boolean(checked) })}
            >
              <div className="flex flex-col">
                <span>Document Editing</span>
                <span className="text-xs text-muted-foreground">Document editing workflows</span>
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
            <DropdownMenuCheckboxItem checked disabled>
              <div className="flex flex-col">
                <span>Memory</span>
                <span className="text-xs text-muted-foreground">Always enabled in LangGraph</span>
              </div>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          className={`h-8 w-8 p-0 rounded flex items-center justify-center ${
            isRecording
              ? "bg-red-600 text-white hover:bg-red-700"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? "Stop recording" : "Start voice input"}
          aria-label={isRecording ? "Stop recording" : "Start voice input"}
          disabled={!(typeof window !== 'undefined' && (((window as any).SpeechRecognition) || ((window as any).webkitSpeechRecognition)))}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          className={`h-8 w-8 p-0 rounded flex items-center justify-center ${
            isWebSearchEnabled 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
          onClick={onToggleWebSearch}
          title={isWebSearchEnabled ? "Disable web search" : "Enable web search"}
          aria-label={isWebSearchEnabled ? "Disable web search" : "Enable web search"}
        >
          <Globe className="h-4 w-4" />
        </button>
      </div>

      <ThreadPrimitive.If running={false}>
        <TooltipIconButton
          tooltip="Send"
          type="button"
          variant="default"
          className={`dark:border-muted-foreground/90 border-muted-foreground/60 p-2 border border-zinc-300 dark:border-zinc-600 scale-100 ${
            hasText 
              ? 'hover:bg-primary/75 cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          aria-label="Send message"
          onClick={handleSendFromButton}
          disabled={!hasText}
        >
          <ChevronRightIcon />
        </TooltipIconButton>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Stop generating"
            type="button"
            variant="default"
            className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 p-2 border border-zinc-300 dark:border-zinc-600 scale-100"
            aria-label="Stop generating"
          >
            <Square size={20} />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
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
        <div className="text-white col-start-1 row-start-1 leading-none break-words text-sm">
          <MessagePrimitive.Content
            components={{
              Text: MarkdownText,
                  tools: { 
                by_name: {
                  web_search: WebSearchTool,
                  tiptap_ai: TiptapAITool,
                      sheet_ai: SheetAITool,
                      document_ai: DocumentAITool,
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

        <div className="bg-muted text-foreground col-start-2 rounded-3xl px-5 py-2.5 break-words">
          <MessagePrimitive.Content components={{ Text: MarkdownText }} />
          
          {/* Display attached files */}
          <MessagePrimitive.Attachments>
            {(attachments: any[]) => (
              <FileAttachmentDisplay 
                files={attachments.map((att: any) => ({
                  id: att.fileId,
                  file_id: att.fileId,
                  name: att.fileName,
                  path: att.filePath,
                  type: 'file'
                }))}
              />
            )}
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
