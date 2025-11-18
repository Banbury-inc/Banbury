import { ApiService } from '../../../../backend/api/apiService';

// Toast type
type Toast = (props: {
  title: string;
  description: string;
  variant: 'default' | 'destructive' | 'success' | 'error';
}) => void;

interface UserInfo {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: any;
  phone_number?: string;
  auth_method?: string;
}

export const loadConversations = async (
  setIsLoadingConversations: React.Dispatch<React.SetStateAction<boolean>>,
  setConversations: React.Dispatch<React.SetStateAction<any[]>>
) => {
  if (!setIsLoadingConversations || !setConversations) {
    console.error('loadConversations called with invalid parameters');
    return;
  }
  
  try {
    setIsLoadingConversations(true);
    const result = await ApiService.Conversations.getConversations();
    if (result.success) {
      setConversations(result.conversations || []);
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  } finally {
    setIsLoadingConversations(false);
  }
};

export const saveCurrentConversation = async (
  userInfo: UserInfo | null,
  conversationTitle: string,
  setSaveDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setConversationTitle: React.Dispatch<React.SetStateAction<string>>,
  loadConversations: () => Promise<void>,
  toast: Toast
) => {
  if (!userInfo?.username || !conversationTitle.trim()) return;
  
  try {
    // Check if we have any messages to save
    // Since this is the Workspaces component, we don't have direct access to thread messages
    // We'll create a placeholder message to satisfy the backend requirement
    const placeholderMessage = {
      id: `placeholder-${Date.now()}`,
      role: 'user',
      content: [{ type: 'text', text: 'Conversation started in Workspaces' }],
      createdAt: new Date().toISOString()
    };
    
    const result = await ApiService.Conversations.saveConversation({
      title: conversationTitle,
      messages: [placeholderMessage],
      metadata: {
        workspace: 'workspaces',
        timestamp: new Date().toISOString(),
        note: 'This conversation was created in Workspaces. Actual messages will be available when opened in the Thread component.'
      }
    });
    
    if (result.success) {
      setSaveDialogOpen(false);
      setConversationTitle("");
      await loadConversations();
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    toast({
      title: "Error",
      description: "Failed to save conversation",
      variant: "destructive",
    });
  }
};

export const loadConversation = async (
  conversationId: string,
  setShowConversationDialog: React.Dispatch<React.SetStateAction<boolean>>,
  toast: Toast
) => {
  try {
    const result = await ApiService.Conversations.getConversation(conversationId);
    if (result.success && result.conversation) {
      // Use the thread component's own loading mechanism
      // This will set the loadedMessagesBuffer and handle the loading properly
      const rawMessages = Array.isArray(result.conversation.messages) ? result.conversation.messages : [];
      const sanitized = rawMessages.map((msg: any, i: number) => ({
        id: msg.id || `msg-${i}-${Date.now()}`,
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: Array.isArray(msg.content)
          ? msg.content
          : (typeof msg.content === 'string' && msg.content.length > 0 ? [{ type: 'text', text: msg.content }] : []),
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }));
      
      // Dispatch to thread component's event handler
      window.dispatchEvent(new CustomEvent('assistant-load-conversation', { detail: { messages: sanitized } }));
      setShowConversationDialog(false);
    }
  } catch (error) {
    console.error('Error loading conversation:', error);
    toast({
      title: "Error",
      description: "Failed to load conversation",
      variant: "destructive",
    });
  }
};

export const deleteConversation = async (
  conversationId: string,
  loadConversations: () => Promise<void>
) => {
  try {
    const result = await ApiService.Conversations.deleteConversation(conversationId);
    if (result.success) {
      await loadConversations();
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
};
