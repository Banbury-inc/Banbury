import { ApiService } from "../../../../../../backend/api/apiService";

interface LoadConversationsParams {
  userInfo: {
    username: string;
    email?: string;
  } | null;
  setConversations: (conversations: any[]) => void;
  setIsLoadingConversations: (loading: boolean) => void;
}

export async function loadConversations({
  userInfo,
  setConversations,
  setIsLoadingConversations,
}: LoadConversationsParams): Promise<void> {
  if (!userInfo?.username) return;
  
  setIsLoadingConversations(true);
  try {
    const result = await ApiService.Conversations.getConversations();
    if (result.success && result.conversations) {
      setConversations(result.conversations);
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  } finally {
    setIsLoadingConversations(false);
  }
}
