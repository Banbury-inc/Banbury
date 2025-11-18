import { ApiService } from "../apiService";

export interface Conversation {
  _id: string;
  title: string;
  messages: any[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface SaveConversationRequest {
  title: string;
  messages: any[];
  metadata?: any;
}

export interface ConversationResponse {
  success: boolean;
  conversations?: Conversation[];
  conversation?: Conversation;
  conversation_id?: string;
  message?: string;
  error?: string;
}

export default class Conversations {
  constructor(api: ApiService) {}

  static async saveConversation(data: SaveConversationRequest): Promise<ConversationResponse> {
    try {
      const result = await ApiService.post<ConversationResponse>('/conversations/save/', data);
      return result;
    } catch (error) {
      console.error('Error saving conversation:', error);
      return {
        success: false,
        error: 'Failed to save conversation',
      };
    }
  }

  static async getConversations(limit: number = 50, offset: number = 0): Promise<ConversationResponse> {
    try {
      const result = await ApiService.get<ConversationResponse>(`/conversations/list/?limit=${limit}&offset=${offset}`);
      return result;
    } catch (error) {
      console.error('Error loading conversations:', error);
      return {
        success: false,
        error: 'Failed to load conversations',
      };
    }
  }

  static async getConversation(conversationId: string): Promise<ConversationResponse> {
    try {
      const result = await ApiService.get<ConversationResponse>(`/conversations/${conversationId}/`);
      return result;
    } catch (error) {
      console.error('Error loading conversation:', error);
      return {
        success: false,
        error: 'Failed to load conversation',
      };
    }
  }

  static async deleteConversation(conversationId: string): Promise<ConversationResponse> {
    try {
      const result = await ApiService.delete<ConversationResponse>(`/conversations/${conversationId}/delete/`);
      return result;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return {
        success: false,
        error: 'Failed to delete conversation',
      };
    }
  }

  static async updateConversationTitle(conversationId: string, newTitle: string): Promise<ConversationResponse> {
    try {
      const result = await ApiService.put<ConversationResponse>(`/conversations/${conversationId}/title/`, { title: newTitle });
      return result;
    } catch (error) {
      console.error('Error updating conversation title:', error);
      return {
        success: false,
        error: 'Failed to update conversation title',
      };
    }
  }

  static async updateConversation(conversationId: string, data: SaveConversationRequest): Promise<ConversationResponse> {
    try {
      const result = await ApiService.put<ConversationResponse>(`/conversations/${conversationId}/update/`, data);
      return result;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return {
        success: false,
        error: 'Failed to update conversation',
      };
    }
  }
}

