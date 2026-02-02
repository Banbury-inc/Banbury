import { ApiService } from "../../../../../../backend/api/apiService";
import { FileSystemItem } from "../../../../../../utils/fileTreeUtils";

interface LoadConversationParams {
  conversationId: string;
  runtime: any;
  setAttachedFiles: (files: FileSystemItem[]) => void;
  setAttachedEmails: (emails: any[]) => void;
  setToolPreferences: (prefs: any) => void;
  setLoadedMessagesBuffer: (messages: any[] | null) => void;
  setThreadKey: (key: number) => void;
  setShowConversationDialog: (show: boolean) => void;
  deriveToolPreferences: (raw?: any) => any;
  tryApplyMessagesToRuntime: (rt: any, msgs: any[]) => Promise<{ ok: boolean; path: string; count: number }>;
}

export async function loadConversation({
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
}: LoadConversationParams): Promise<void> {
  try {
      const result = await ApiService.Conversations.getConversation(conversationId);
      if (!result.success || !result.conversation) return;

      const conversation = result.conversation;

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
        setToolPreferences(deriveToolPreferences(conversation.metadata.toolPreferences));
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
            // Fallback to direct application if provider path didn't stick
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
}
