import { ApiService } from "../../../../../../backend/api/apiService";
import { FileSystemItem } from "../../../../../../utils/fileTreeUtils";

interface HandleRunEndParams {
  runtime: any;
  conversations: any[];
  attachedFiles: FileSystemItem[];
  attachedEmails: any[];
  toolPreferences: any;
  loadConversations: () => Promise<void>;
}

export async function handleRunEnd({
  runtime,
  conversations,
  attachedFiles,
  attachedEmails,
  toolPreferences,
  loadConversations,
}: HandleRunEndParams): Promise<void> {
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
      return;
    }
    
    // Find the first user message to use as title
    const firstUserMessage = messages.find((msg: any) => msg.role === 'user');
    if (!firstUserMessage) {
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
    
    if (existingConversation) {
      // Calculate token usage from messages
      // Try to get usage from runtime first, otherwise estimate from messages
      let tokenUsage = 0;
      try {
        // Check if runtime has usage information
        const runtimeState = runtime?.getState?.() || runtime?._threadBinding?.getState?.() || {};
        const usage = runtimeState?.usage || runtimeState?.latestRun?.usage;
        
        if (usage && (usage.input_tokens || usage.output_tokens || usage.total_tokens)) {
          tokenUsage = usage.total_tokens || (usage.input_tokens + usage.output_tokens) || 0;
        } else {
          // Estimate tokens: roughly 1 token per 4 characters for text content
          tokenUsage = messages.reduce((total: number, msg: any) => {
            if (msg.content && Array.isArray(msg.content)) {
              const textLength = msg.content
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text || '')
                .join('')
                .length;
              return total + Math.ceil(textLength / 4);
            } else if (typeof msg.content === 'string') {
              return total + Math.ceil(msg.content.length / 4);
            }
            return total;
          }, 0);
        }
      } catch (e) {
        // If calculation fails, default to 0
        console.warn('Failed to calculate token usage:', e);
      }
      
      // Update existing conversation
      await ApiService.Conversations.updateConversation(existingConversation._id, {
        title,
        messages,
        metadata: {
          attachedFiles: attachedFiles.map(f => ({ id: f.file_id, name: f.name })),
          attachedEmails: attachedEmails.map(e => ({ id: e.id, subject: e.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject' })),
          toolPreferences,
          lastUpdated: new Date().toISOString()
        },
        token_usage: tokenUsage > 0 ? tokenUsage : undefined
      });
    } else {
      // Create new conversation
      const result = await ApiService.Conversations.saveConversation({
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
        await loadConversations();
      }
    }
  } catch (error) {
    console.error('Error auto-saving conversation:', error);
  }
}
