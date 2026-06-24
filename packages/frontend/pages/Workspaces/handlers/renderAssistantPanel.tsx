import React from 'react'
import { TimerReset, ChevronDown, Trash2 } from 'lucide-react'
import OlympusTabs, { Tab as OlympusTab } from '../../../components/common/Tabs/Tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/common/ui/dropdown-menu'
import { Panel, WorkspaceTab, DragState, UserInfo, PanelGroup, AiTab } from '../types'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { getAllTabs } from './panelUtils'
import { TodoList } from '../../../components/RightPanel/TodoList'

interface Conversation {
  _id: string
  title: string
  created_at: string
}

interface RenderAssistantPanelProps {
  panel: Panel
  activePanelId: string
  dragState: DragState
  userInfo: UserInfo | null
  selectedFile: FileSystemItem | null
  selectedEmail: any
  conversations: Conversation[]
  isLoadingConversations: boolean
  setActivePanelId: (panelId: string) => void
  handleTabChange: (panelId: string, tabId: string) => void
  handleCloseTab: (tabId: string, panelId: string) => void
  handleTabAdd: (panelId: string) => void
  handleTabReorder: (panelId: string, sourceIndex: number, destinationIndex: number) => void
  onLoadConversation: (conversationId: string, tabId: string) => void
  onDeleteConversation: (conversationId: string) => void
  onClearConversation: (tabId: string) => void
  onEmailSelect: (email: any) => void
  setAssistantDockLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  assistantDockLayout: PanelGroup
  onSplitPreview?: (direction: 'horizontal' | 'vertical' | null, position: { x: number; y: number }) => void
  splitPreviewBoundsSelector?: string
}

export function renderAssistantPanel({
  panel,
  activePanelId,
  dragState,
  userInfo,
  selectedFile,
  selectedEmail,
  conversations,
  isLoadingConversations,
  setActivePanelId,
  handleTabChange,
  handleCloseTab,
  handleTabAdd,
  handleTabReorder,
  onLoadConversation,
  onDeleteConversation,
  onClearConversation,
  onEmailSelect,
  setAssistantDockLayout,
  assistantDockLayout,
  onSplitPreview,
  splitPreviewBoundsSelector,
}: RenderAssistantPanelProps) {
  const isActive = panel.id === activePanelId
  const activeTabId = panel.activeTabId || panel.tabs[0]?.id

  // Filter to only AI tabs for display
  const aiTabs = panel.tabs.filter((t): t is AiTab => t.type === 'ai')
  // Also handle non-AI tabs that might be dropped here (file/email/calendar)
  const allTabs = panel.tabs
  
  // Get all tabs across all panels in the assistant dock layout
  const allTabsAcrossPanels = getAllTabs(assistantDockLayout)
  // Allow closing if there are tabs in other panels OR more than one tab in current panel
  const canCloseTab = allTabsAcrossPanels.length > 1 || allTabs.length > 1

  const getTabLabel = (tab: WorkspaceTab): string => {
    if (tab.type === 'ai') return tab.label
    if (tab.type === 'file') return tab.fileName
    if (tab.type === 'email') return tab.subject
    if (tab.type === 'calendar') return tab.title
    return 'Unknown'
  }

  return (
    <div
      key={panel.id}
      data-panel-id={panel.id}
      className={`h-full bg-card border-l border-zinc-200 dark:border-white/[0.06] flex flex-col relative shadow-soft ${
        isActive ? 'ring-2 ring-blue-500' : 'ring-1 ring-zinc-300 dark:ring-white/[0.06]'
      }`}
      onClick={() => setActivePanelId(panel.id)}
    >
      {/* AI Tabs Bar */}
      <div className="bg-background flex items-stretch border-b border-zinc-200 dark:border-white/[0.06]">
        <div className="flex items-stretch flex-1 min-w-0 overflow-x-hidden">
          <OlympusTabs
            tabs={allTabs.map<OlympusTab>((t) => ({ id: t.id, label: getTabLabel(t) }))}
            activeTab={activeTabId}
            onTabChange={(tabId) => handleTabChange(panel.id, tabId)}
            onTabClose={canCloseTab ? (tabId) => handleCloseTab(tabId, panel.id) : undefined}
            onTabAdd={() => handleTabAdd(panel.id)}
            onReorder={(sourceIndex, destinationIndex) => handleTabReorder(panel.id, sourceIndex, destinationIndex)}
            dragContext={{ panelId: panel.id }}
            suppressReorderIndicator={Boolean(dragState.dropTargetPanel && dragState.dropZone)}
            onSplitPreview={onSplitPreview}
            splitPreviewBoundsSelector={splitPreviewBoundsSelector}
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
                      onClick={() => onLoadConversation(conversation._id, activeTabId)}
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
      {activeTabId && (
        <TodoList
          threadId={(allTabs.find(t => t.id === activeTabId) as AiTab | undefined)?.threadId || ''}
        />
      )}

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {dragState.isDragging && (
          <div className="absolute inset-0 z-[9000] cursor-grabbing bg-transparent" />
        )}
        {allTabs.map((tab) => {
          const isTabActive = tab.id === activeTabId

          if (tab.type === 'ai') {
            // Render a portal container - the actual AiConversationTabPane
            // is rendered by AiTabRuntimeHost and portaled into this container
            return (
              <div
                key={tab.id}
                className={`absolute inset-0 ${isTabActive ? '' : 'hidden'}`}
              >
                <div
                  data-ai-tab-container={tab.id}
                  className="h-full w-full"
                />
              </div>
            )
          }

          // For file/email/calendar tabs that end up in the assistant panel
          // We render a placeholder - in a full implementation, these would show the appropriate viewer
          return (
            <div
              key={tab.id}
              className={`absolute inset-0 flex items-center justify-center text-muted-foreground ${isTabActive ? '' : 'hidden'}`}
            >
              <div className="text-center">
                <p className="text-sm">
                  {tab.type === 'file' && `File: ${tab.fileName}`}
                  {tab.type === 'email' && `Email: ${tab.subject}`}
                  {tab.type === 'calendar' && 'Calendar'}
                </p>
                <p className="text-xs mt-1 opacity-60">Drag to middle panel to view</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

