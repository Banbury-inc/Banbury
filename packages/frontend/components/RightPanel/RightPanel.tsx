import { useState, useCallback, useEffect } from 'react'
import { Menu, TimerReset, ChevronDown, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import OlympusTabs, { Tab as OlympusTab } from '../common/Tabs/Tabs'
import { AiConversationTabPane } from './AiConversationTabPane'
import {
  AiTab,
  createAiTab,
  createInitialAiTab,
  getNextActiveTabId,
  reorderAiTabs,
} from './handlers/aiTabHandlers'
import {
  isDefaultAiTabLabel,
  deriveAiTabTitleFromText,
} from './handlers/aiTabTitle'
import { TodoList } from './TodoList'
import { registerTabThreadId } from '../MiddlePanel/PlanViewer/handlers/planTodoBridge'
import { subscribeTodoEventListener } from './handlers/todoStoreHandlers'

interface Conversation {
  _id: string
  title: string
  created_at: string
}

interface RightPanelProps {
  userInfo: any
  selectedFile: any
  selectedEmail: any
  conversations: Conversation[]
  isLoadingConversations: boolean
  onToggleCollapse: () => void
  onLoadConversation: (conversationId: string, tabId: string) => void
  onDeleteConversation: (conversationId: string) => void
  onClearConversation: (tabId: string) => void
  onEmailSelect: (email: any) => void
  hasCalendarOpen?: boolean
}

export function RightPanel({
  userInfo,
  selectedFile,
  selectedEmail,
  conversations,
  isLoadingConversations,
  onToggleCollapse,
  onLoadConversation,
  onDeleteConversation,
  onClearConversation,
  onEmailSelect,
  hasCalendarOpen = false,
}: RightPanelProps): JSX.Element {
  const shouldShowCollapseButton = selectedFile || selectedEmail || hasCalendarOpen
  
  // AI tabs state - initialize both states together to ensure consistency
  const [aiTabs, setAiTabs] = useState<AiTab[]>(() => [createInitialAiTab()])
  const [activeAiTabId, setActiveAiTabId] = useState<string>('')

  // Update activeAiTabId if the initial tab changes
  useEffect(() => {
    if (!activeAiTabId && aiTabs.length > 0) {
      setActiveAiTabId(aiTabs[0].id)
    }
  }, [activeAiTabId, aiTabs])

  // Subscribe to todo events at the RightPanel level so it's always active
  useEffect(() => {
    const unsubscribe = subscribeTodoEventListener()
    return unsubscribe
  }, [])

  // Register/update window delegate for routing assistant-ai-request to active tab
  // This runs synchronously during render to ensure it's available immediately
  useEffect(() => {
    // Store reference to current active tab for the delegate
    ;(window as any).__banburyActiveAiTabId = activeAiTabId;
    
    // Store aiTabs on window so PlanViewer can look up threadIds
    ;(window as any).__banburyAiTabs = aiTabs;
    
    // Register ALL tab threadIds for PlanViewer bridge
    aiTabs.forEach(tab => {
      registerTabThreadId(tab.id, tab.threadId)
    })
    
    return () => {
      delete (window as any).__banburyActiveAiTabId
      delete (window as any).__banburyAiTabs
    }
  }, [activeAiTabId, aiTabs])
  
  // Also register immediately on first render (before effects run)
  // This ensures the data is available for any synchronous access
  if (typeof window !== 'undefined') {
    ;(window as any).__banburyActiveAiTabId = activeAiTabId;
    ;(window as any).__banburyAiTabs = aiTabs;
  }

  const handleTabAdd = useCallback((label?: string) => {
    const newTab = createAiTab(label)
    setAiTabs((prev) => [...prev, newTab])
    setActiveAiTabId(newTab.id)
  }, [])

  const handleTabClose = useCallback((tabId: string) => {
    setAiTabs((prev) => {
      if (prev.length <= 1) return prev // Don't close last tab
      
      const nextActiveId = getNextActiveTabId(prev, tabId)
      const newTabs = prev.filter((t) => t.id !== tabId)
      
      // Update active tab if we're closing the current one
      setActiveAiTabId((currentActive) => {
        if (currentActive === tabId) {
          return nextActiveId || newTabs[0]?.id || ''
        }
        return currentActive
      })
      
      return newTabs
    })
  }, [])

  const handleTabChange = useCallback((tabId: string) => {
    setActiveAiTabId(tabId)
  }, [])

  const handleTabReorder = useCallback((sourceIndex: number, destinationIndex: number) => {
    setAiTabs((prev) => reorderAiTabs(prev, sourceIndex, destinationIndex))
  }, [])

  const handleLoadConversationInNewTab = useCallback((conversationId: string, title: string) => {
    // Create a new tab with the conversation title
    const newTab = createAiTab(title)
    setAiTabs((prev) => [...prev, newTab])
    setActiveAiTabId(newTab.id)
    
    // Load the conversation into the new tab (with small delay to allow tab to mount)
    setTimeout(() => {
      onLoadConversation(conversationId, newTab.id)
    }, 50)
  }, [onLoadConversation])

  const handleClearActiveConversation = useCallback(() => {
    onClearConversation(activeAiTabId)
  }, [onClearConversation, activeAiTabId])

  // Listen for create-new-ai-tab events to create a new tab
  // Supports optional detail.label to set a custom tab label (used by PlanViewer agents)
  useEffect(() => {
    const handleCreateNewTab = (event: Event) => {
      const customEvent = event as CustomEvent<{ label?: string }>
      const label = customEvent.detail?.label
      handleTabAdd(label)
    }

    window.addEventListener('create-new-ai-tab', handleCreateNewTab)
    return () => {
      window.removeEventListener('create-new-ai-tab', handleCreateNewTab)
    }
  }, [handleTabAdd])

  // Listen for title candidate events and update tab labels when still default
  useEffect(() => {
    const handleTitleCandidate = (event: Event) => {
      const { tabId, text } = (event as CustomEvent).detail || {}
      if (!tabId || !text) return

      const derivedTitle = deriveAiTabTitleFromText(text)
      if (!derivedTitle) return

      setAiTabs((prev) =>
        prev.map((tab) => {
          if (tab.id === tabId && isDefaultAiTabLabel(tab.label)) {
            return { ...tab, label: derivedTitle }
          }
          return tab
        })
      )
    }

    window.addEventListener('assistant-ai-tab-title-candidate', handleTitleCandidate)
    return () => {
      window.removeEventListener('assistant-ai-tab-title-candidate', handleTitleCandidate)
    }
  }, [])
  
  return (
    <div className="h-full bg-card border-l border-zinc-200 dark:border-white/[0.06] flex flex-col relative shadow-soft">
      {/* Collapse button for assistant panel - positioned on left border */}
      {shouldShowCollapseButton && (
        <button
          onClick={onToggleCollapse}
          className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-20 h-6 w-6 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background border border-zinc-300 dark:border-white/[0.06] transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black shadow-soft burger-button"
          title="Collapse assistant panel"
        >
          <Menu className="h-4 w-4" strokeWidth={1} />
        </button>
      )}

      {/* AI Tabs Bar */}
      <div className="bg-background flex items-stretch border-b border-zinc-200 dark:border-white/[0.06]">
        <div className="flex items-stretch flex-1 min-w-0 overflow-x-hidden">
          <OlympusTabs
            tabs={aiTabs.map<OlympusTab>((t) => ({ id: t.id, label: t.label }))}
            activeTab={activeAiTabId}
            onTabChange={handleTabChange}
            onTabClose={aiTabs.length > 1 ? handleTabClose : undefined}
            onTabAdd={handleTabAdd}
            onReorder={handleTabReorder}
          />
        </div>
        
        {/* Conversation Management Dropdown */}
        <div className="flex items-center gap-2 px-2 border-l border-zinc-200 dark:border-white/[0.06]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 px-2 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-transparent transition-colors rounded-md flex items-center justify-center gap-1.5 focus:outline-none">
                <TimerReset className="h-3.5 w-3.5" strokeWidth={1} />
                <ChevronDown className="h-3 w-3" strokeWidth={1} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="px-2 py-2 text-sm text-zinc-400 text-center">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-2 py-2 text-sm text-zinc-400 text-center">
                  No saved conversations
                </div>
              ) : (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-zinc-500 tracking-wide">
                    Saved Conversations
                  </div>
                  {conversations.map((conversation) => (
                    <DropdownMenuItem 
                      key={conversation._id}
                      onClick={() => handleLoadConversationInNewTab(conversation._id, conversation.title)}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{conversation.title}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conversation._id)
                        }}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-red-400 hover:text-red-300 transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1} />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Todo List for active thread */}
      {activeAiTabId && (
        <TodoList
          threadId={aiTabs.find(t => t.id === activeAiTabId)?.threadId || ''}
        />
      )}

      {/* Thread Components - keep all mounted but hide inactive */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {aiTabs.map((tab) => (
          <div
            key={tab.id}
            className={`absolute inset-0 ${tab.id === activeAiTabId ? '' : 'hidden'}`}
          >
            <AiConversationTabPane
              tabId={tab.id}
              threadId={tab.threadId}
              userInfo={userInfo}
              selectedFile={selectedFile}
              selectedEmail={selectedEmail}
              onEmailSelect={onEmailSelect}
              onClearConversation={handleClearActiveConversation}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
