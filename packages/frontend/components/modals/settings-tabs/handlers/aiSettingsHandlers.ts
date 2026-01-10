import { ApiService } from '../../../../../backend/api/apiService'

export interface DeleteAllConversationsResult {
  success: boolean
  deletedCount?: number
  error?: string
}

export async function deleteAllConversations(): Promise<DeleteAllConversationsResult> {
  try {
    const result = await ApiService.Conversations.deleteAllConversations()
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete conversations',
      }
    }
    
    return {
      success: true,
      deletedCount: result.deleted_count,
    }
  } catch (error) {
    console.error('Error deleting all conversations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
