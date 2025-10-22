import { Menu, TimerReset, ChevronDown, Plus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Thread } from './composer/thread'

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
  onLoadConversation: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void
  onClearConversation: () => void
  onEmailSelect: (email: any) => void
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
}: RightPanelProps): JSX.Element {
  return (
    <div className="h-full bg-background border-l border-zinc-200 dark:border-gray-800 flex flex-col relative">
      {/* Collapse button for assistant panel - positioned on left border */}
      <button
        onClick={onToggleCollapse}
        className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-20 h-6 w-6 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background border border-zinc-300 dark:border-zinc-600 transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black shadow-lg burger-button"
        title="Collapse assistant panel"
      >
        <Menu className="h-3 w-3" />
      </button>
      {/* Conversation Management Dropdown */}
      <div className="bg-background dark:bg-background px-4 py-2 flex items-center justify-end gap-2 border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 px-3 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background dark:bg-background transition-colors rounded-md flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black border border-zinc-200 dark:border-zinc-700">
                <TimerReset className="h-3 w-3" />
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
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
                      onClick={() => onLoadConversation(conversation._id)}
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
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="relative group">
            <button
              onClick={onClearConversation}
              className="h-8 w-8 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background dark:bg-background transition-colors rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black border border-zinc-200 dark:border-zinc-700"
            >
              <Plus className="h-3 w-3" />
            </button>
            {/* Custom CSS tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-accent dark:bg-accent text-zinc-900 dark:text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none border border-zinc-200 dark:border-zinc-700">
              Clear Conversation
            </div>
          </div>
        </div>
      </div>
      {/* Thread Component */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Thread 
          userInfo={userInfo} 
          selectedFile={selectedFile}
          selectedEmail={selectedEmail}
          onEmailSelect={onEmailSelect}
        />
      </div>
    </div>
  )
}

