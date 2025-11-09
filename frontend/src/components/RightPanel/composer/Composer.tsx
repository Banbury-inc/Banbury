import React, { useState, useEffect, useRef } from "react";
import * as AssistantUI from "@assistant-ui/react";
import {
  ChevronRightIcon,
  Square,
  Globe,
  Wrench,
  Mic,
  MicOff,
  ChevronDown,
} from "lucide-react";

import { ChatTiptapComposer } from "../../ChatTiptapComposer";
import { FileAttachment } from "./components/file-attachment";
import { FileAttachmentDisplay } from "./components/file-attachment-display";
import { PendingChangesBar } from "./components/pending-changes-bar";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { FileSystemItem } from "../../../utils/fileTreeUtils";
import { ThreadScrollToBottom } from "./ThreadScrollToBottom";
import { handleSend } from "./handlers/handleSend";
import { 
  getModelDisplayName, 
  AVAILABLE_MODELS, 
  getModelById,
  getDefaultModelForProvider,
  type ModelProvider 
} from "./handlers/getModelDisplayName";

import type { FC } from "react";
import { Typography } from "@/components/ui/typography";

const {
  ComposerPrimitive,
  ThreadPrimitive,
  useComposerRuntime,
} = AssistantUI as any;

interface ComposerToolPreferences {
  web_search: boolean;
  tiptap_ai: boolean;
  read_file: boolean;
  gmail: boolean;
  langgraph_mode: boolean;
  browser: boolean;
  x_api: boolean;
  slack: boolean;
  model_provider: "anthropic" | "openai";
  model_id?: string;
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
  isWebSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  toolPreferences: ComposerToolPreferences;
  onUpdateToolPreferences: (prefs: ComposerToolPreferences) => void;
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

  return (
    <div className="relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)] pb-4 md:pb-6" style={{ backgroundColor: 'transparent' }}>
      <ThreadScrollToBottom />

      <div className="relative flex w-full flex-col">
        {/* Display attachments (files + emails) above the composer */}
        {(attachedFiles.length > 0 || attachedEmails.length > 0) && (
          <div className="bg-accent border-b border-border rounded-t-2xl px-2 py-0.5">
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
          <div className={`bg-accent border-0 ${(attachedFiles.length > 0 || attachedEmails.length > 0 || pendingChanges.length > 0) ? 'border-t-0 rounded-t-none' : 'border-t border-zinc-300 dark:border-zinc-700 rounded-t-2xl'} max-h-[50vh] overflow-y-auto`}>
            <ChatTiptapComposer
              hiddenInputRef={inputRef}
              userInfo={userInfo}
              onFileAttach={onFileAttach}
              onAttachmentPayload={onAttachmentPayload}
              placeholder="Send a message..."
              className="min-h-16"
              onSend={() => handleSend({ composer, onSend: onSend })}
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
            onSend={() => handleSend({ composer, onSend: onSend })}
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
  toolPreferences: ComposerToolPreferences;
  onUpdateToolPreferences: (prefs: ComposerToolPreferences) => void;
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
    <div className="bg-accent border-0 relative flex items-center justify-between rounded-b-2xl p-2">
      <div className="flex pl-4 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="primary"
              className="h-8 px-3 gap-1.5"
              title="Model"
              aria-label="Model"
            >
              <Typography variant="small" className="text-xs font-medium">
                {getModelDisplayName(toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider))}
              </Typography>
              <ChevronDown height={16} width={16} strokeWidth={1} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 p-2 max-h-96 overflow-y-auto">
            <DropdownMenuRadioGroup
              value={toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider)}
              onValueChange={(modelId: string) => {
                const selectedModel = getModelById(modelId)
                if (selectedModel) {
                  onUpdateToolPreferences({ 
                    ...toolPreferences, 
                    model_id: modelId,
                    model_provider: selectedModel.provider 
                  })
                }
              }}
            >
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2 py-1">
                OpenAI
              </DropdownMenuLabel>
              {AVAILABLE_MODELS.filter(m => m.provider === "openai").map(model => (
                <DropdownMenuRadioItem key={model.id} value={model.id}>
                  <div className="flex flex-col gap-0.5">
                    <Typography variant="small" className="text-xs">
                      {model.name}
                    </Typography>
                    {model.description && (
                      <Typography variant="small" className="text-[10px] text-muted-foreground">
                        {model.description}
                      </Typography>
                    )}
                  </div>
                </DropdownMenuRadioItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2 py-1">
                Anthropic
              </DropdownMenuLabel>
              {AVAILABLE_MODELS.filter(m => m.provider === "anthropic").map(model => (
                <DropdownMenuRadioItem key={model.id} value={model.id}>
                  <div className="flex flex-col gap-0.5">
                    <Typography variant="small" className="text-xs">
                      {model.name}
                    </Typography>
                    {model.description && (
                      <Typography variant="small" className="text-[10px] text-muted-foreground">
                        {model.description}
                      </Typography>
                    )}
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
              <Wrench height={16} width={16} strokeWidth={1} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 p-2">
            <DropdownMenuLabel>
              Tools
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={toolPreferences.web_search}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, web_search: Boolean(checked) })}
            >
              <Typography variant="small" className="text-xs text-muted-foreground">Web Search</Typography>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={toolPreferences.read_file}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, read_file: Boolean(checked) })}
            >
              <Typography variant="small" className="text-xs text-muted-foreground">Read File</Typography>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={toolPreferences.gmail}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, gmail: Boolean(checked) })}
            >
              <Typography variant="small" className="text-xs text-muted-foreground">Gmail</Typography>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={toolPreferences.browser}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, browser: Boolean(checked) })}
            >
              <Typography variant="small" className="text-xs text-muted-foreground">Browser</Typography>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={toolPreferences.x_api}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, x_api: Boolean(checked) })}
            >
              <Typography variant="small" className="text-xs text-muted-foreground">X (Twitter)</Typography>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={toolPreferences.slack}
              onCheckedChange={(checked: boolean) => onUpdateToolPreferences({ ...toolPreferences, slack: Boolean(checked) })}
            >
              <Typography variant="small" className="text-xs text-muted-foreground">Slack</Typography>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked disabled>
              <Typography variant="small" className="text-xs text-muted-foreground">Memory</Typography>
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
          {isRecording ? <MicOff height={16} width={16} strokeWidth={1} /> : <Mic height={16} width={16} strokeWidth={1} />}
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
          <Globe height={16} width={16} strokeWidth={1} />
        </Button>
      </div>

      <ThreadPrimitive.If running={false}>
        <Button
          type="button"
          variant="primary"
          size="icon"
          className={`h-8 w-8 ${
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
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="primary"
            size="icon"
            title="Stop generating"
            aria-label="Stop generating"
            className="h-8 w-8 cursor-pointer bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100" 
          >
            <Square height={14} width={14} strokeWidth={1} />
          </Button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
  );
};

