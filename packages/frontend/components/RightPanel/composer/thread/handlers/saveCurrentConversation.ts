import { ApiService } from "../../../../../../backend/api/apiService";
import { FileSystemItem } from "../../../../../../utils/fileTreeUtils";
import type { ThreadToolPreferences } from "./deriveToolPreferences";

interface SaveCurrentConversationParams {
  userInfo: {
    username: string;
    email?: string;
  } | null;
  conversationTitle: string;
  runtime: any;
  attachedFiles: FileSystemItem[];
  attachedEmails: any[];
  toolPreferences: ThreadToolPreferences;
  setSaveDialogOpen: (open: boolean) => void;
  setConversationTitle: (title: string) => void;
  loadConversations: () => Promise<void>;
}

export async function saveCurrentConversation({
  userInfo,
  conversationTitle,
  runtime,
  attachedFiles,
  attachedEmails,
  toolPreferences,
  setSaveDialogOpen,
  setConversationTitle,
  loadConversations,
}: SaveCurrentConversationParams): Promise<void> {
  if (!userInfo?.username || !conversationTitle.trim()) return;
  
  try {
    // Get current messages from the thread runtime
    const messages = runtime.messages || [];
    
    // Check if we have any messages to save
    if (messages.length === 0) {
      return;
    }
    
    const result = await ApiService.Conversations.saveConversation({
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
}
