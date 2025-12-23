import { ApiService } from '../../../../backend/api/apiService'

interface ConversationHandlersDeps {
  setExpandedConversation: (id: string | null) => void
  setConversationDetails: (details: any) => void
  setConversationDetailsLoading: (loading: boolean) => void
  setConversationUserFilter: (filter: string) => void
  loadConversationsAnalytics: (days: number, userFilter: string) => void
}

export function createAIConversationsHandlers(deps: ConversationHandlersDeps) {
  const {
    setExpandedConversation,
    setConversationDetails,
    setConversationDetailsLoading,
    setConversationUserFilter,
    loadConversationsAnalytics
  } = deps

  async function loadConversationDetails(conversationId: string) {
    setConversationDetailsLoading(true)
    try {
      const response = await ApiService.getConversationAdmin(conversationId) as any
      if (response.success) {
        setConversationDetails(response.conversation)
        setExpandedConversation(conversationId)
      }
    } catch (error) {
      console.error('Failed to load conversation details:', error)
      setConversationDetails(null)
    } finally {
      setConversationDetailsLoading(false)
    }
  }

  function handleConversationRowClick(conversationId: string, expandedConversation: string | null) {
    if (expandedConversation === conversationId) {
      setExpandedConversation(null)
      setConversationDetails(null)
    } else {
      loadConversationDetails(conversationId)
    }
  }

  function handleCloseConversation(e: React.MouseEvent) {
    e.stopPropagation()
    setExpandedConversation(null)
    setConversationDetails(null)
  }

  function handleApplyFilter(userFilter: string) {
    loadConversationsAnalytics(30, userFilter)
  }

  function handleClearFilter() {
    setConversationUserFilter('')
    loadConversationsAnalytics(30, '')
  }

  function handleRefresh(userFilter: string) {
    loadConversationsAnalytics(30, userFilter)
  }

  return {
    loadConversationDetails,
    handleConversationRowClick,
    handleCloseConversation,
    handleApplyFilter,
    handleClearFilter,
    handleRefresh
  }
}
