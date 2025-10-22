import React, { useState, useEffect } from 'react'
import { LeftPanel } from '../../../components/LeftPanel/LeftPanel'
import { RightPanel } from '../../../components/RightPanel/RightPanel'
import { MiddlePanel } from '../../../components/MiddlePanel/MiddlePanel'
import { PanelGroup, WorkspaceTab } from '../../Workspaces/types'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { TooltipProvider } from '../../../components/ui/tooltip'
import { X, FileText, Mail, Calendar } from 'lucide-react'
import { DriveService, DriveFile } from '../../../services/driveService'
import { EmailService, GmailMessage } from '../../../services/emailService'
import { CalendarService, CalendarEvent } from '../../../services/calendarService'
import { ScopeService } from '../../../services/scopeService'
import { ApiService } from '../../../services/apiService'
import { DemoRuntimeProvider } from './DemoRuntimeProvider'

// Mock data
const mockUserInfo = {
  username: 'demo_user',
  email: 'demo@example.com',
}

const mockConversations = [
  {
    _id: 'conv-1',
    title: 'Project Planning Discussion',
    created_at: '2025-10-20T10:30:00Z',
  },
  {
    _id: 'conv-2',
    title: 'Code Review Notes',
    created_at: '2025-10-21T14:15:00Z',
  },
  {
    _id: 'conv-3',
    title: 'Bug Fix Strategy',
    created_at: '2025-10-22T09:45:00Z',
  },
]

const mockFile: FileSystemItem = {
  id: 'file-1',
  name: 'Q3-Product-Strategy.docx',
  type: 'file',
  path: '/documents/Q3-Product-Strategy.docx',
  size: 2048,
  modified: new Date('2025-10-22T08:00:00Z'),
}


const mockFile2: FileSystemItem = {
  id: 'file-2',
  name: 'demo.tsx',
  type: 'file',
  path: '/projects/demo.tsx',
  size: 1024,
  modified: new Date('2025-10-21T10:00:00Z'),
}

// Mock Local/S3 Files
const mockLocalFiles = [
  {
    file_id: 'local-1',
    file_name: 'Meeting Notes.txt',
    file_path: '/notes/Meeting Notes.txt',
    file_type: 'text/plain',
    file_size: 2048,
    date_uploaded: '2025-10-20T14:30:00Z',
    date_modified: '2025-10-21T09:00:00Z',
    s3_url: 'https://example.com/notes/meeting-notes.txt',
    device_name: 'Demo Device',
  },
  {
    file_id: 'local-2',
    file_name: 'Project Timeline.xlsx',
    file_path: '/documents/Project Timeline.xlsx',
    file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    file_size: 102400,
    date_uploaded: '2025-10-18T10:15:00Z',
    date_modified: '2025-10-22T08:30:00Z',
    s3_url: 'https://example.com/documents/project-timeline.xlsx',
    device_name: 'Demo Device',
  },
  {
    file_id: 'local-3',
    file_name: 'Design Mockups.pptx',
    file_path: '/presentations/Design Mockups.pptx',
    file_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    file_size: 1048576,
    date_uploaded: '2025-10-15T16:45:00Z',
    date_modified: '2025-10-19T11:20:00Z',
    s3_url: 'https://example.com/presentations/design-mockups.pptx',
    device_name: 'Demo Device',
  },
  {
    file_id: 'local-4',
    file_name: 'code-sample.py',
    file_path: '/code/code-sample.py',
    file_type: 'text/x-python',
    file_size: 4096,
    date_uploaded: '2025-10-22T07:00:00Z',
    date_modified: '2025-10-22T07:30:00Z',
    s3_url: 'https://example.com/code/code-sample.py',
    device_name: 'Demo Device',
  },
]

// Mock Drive Files
const mockDriveFiles: DriveFile[] = [
  {
    id: 'file-1',
    name: 'Q3-Product-Strategy.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    parents: ['root'],
    modifiedTime: '2025-10-22T08:00:00Z',
    size: '2048',
    webViewLink: '',
  },
  {
    id: 'folder-1',
    name: 'Projects',
    mimeType: 'application/vnd.google-apps.folder',
    parents: ['root'],
    modifiedTime: '2025-10-20T10:00:00Z',
  },
  {
    id: 'file-2',
    name: 'demo.tsx',
    mimeType: 'text/plain',
    parents: ['folder-1'],
    modifiedTime: '2025-10-21T10:00:00Z',
    size: '1024',
    webViewLink: '',
  },
  {
    id: 'file-3',
    name: 'Budget-2025.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    parents: ['root'],
    modifiedTime: '2025-10-19T14:30:00Z',
    size: '4096',
    webViewLink: '',
  },
]

// Mock Email Messages
const mockEmailMessages: GmailMessage[] = [
  {
    id: 'email-1',
    threadId: 'thread-1',
    labelIds: ['INBOX', 'IMPORTANT'],
    snippet: 'Here is the latest update on the project. We are making great progress on the Q3 initiatives...',
    payload: {
      headers: [
        { name: 'From', value: 'Sarah Chen <sarah@example.com>' },
        { name: 'To', value: 'demo@example.com' },
        { name: 'Subject', value: 'Project Update - Q3 Initiative' },
        { name: 'Date', value: 'Wed, 22 Oct 2025 12:00:00 +0000' },
      ],
    },
    internalDate: String(new Date('2025-10-22T12:00:00Z').getTime()),
  },
  {
    id: 'email-2',
    threadId: 'thread-2',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'Team meeting scheduled for tomorrow at 2 PM. Please review the attached agenda...',
    payload: {
      headers: [
        { name: 'From', value: 'John Smith <john@example.com>' },
        { name: 'To', value: 'demo@example.com' },
        { name: 'Subject', value: 'Team Meeting Tomorrow' },
        { name: 'Date', value: 'Wed, 22 Oct 2025 09:30:00 +0000' },
      ],
    },
    internalDate: String(new Date('2025-10-22T09:30:00Z').getTime()),
  },
  {
    id: 'email-3',
    threadId: 'thread-3',
    labelIds: ['INBOX'],
    snippet: 'The code review for PR #245 is complete. Found a few minor issues that need addressing...',
    payload: {
      headers: [
        { name: 'From', value: 'Emily Johnson <emily@example.com>' },
        { name: 'To', value: 'demo@example.com' },
        { name: 'Subject', value: 'Code Review Complete - PR #245' },
        { name: 'Date', value: 'Tue, 21 Oct 2025 16:45:00 +0000' },
      ],
    },
    internalDate: String(new Date('2025-10-21T16:45:00Z').getTime()),
  },
]

// Mock Calendar Events
const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    summary: 'Team Standup',
    description: 'Daily team standup meeting',
    start: {
      dateTime: '2025-10-23T09:00:00Z',
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: '2025-10-23T09:30:00Z',
      timeZone: 'America/New_York',
    },
    attendees: [
      { email: 'demo@example.com', responseStatus: 'accepted' },
      { email: 'sarah@example.com', responseStatus: 'accepted' },
      { email: 'john@example.com', responseStatus: 'accepted' },
    ],
  },
  {
    id: 'event-2',
    summary: 'Product Strategy Review',
    description: 'Review Q3 product strategy document',
    start: {
      dateTime: '2025-10-23T14:00:00Z',
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: '2025-10-23T15:30:00Z',
      timeZone: 'America/New_York',
    },
    location: 'Conference Room B',
    attendees: [
      { email: 'demo@example.com', responseStatus: 'accepted' },
      { email: 'sarah@example.com', responseStatus: 'accepted' },
    ],
  },
  {
    id: 'event-3',
    summary: 'Client Presentation',
    description: 'Present Q3 deliverables to client',
    start: {
      dateTime: '2025-10-24T10:00:00Z',
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: '2025-10-24T11:00:00Z',
      timeZone: 'America/New_York',
    },
    location: 'Zoom Meeting',
    attendees: [
      { email: 'demo@example.com', responseStatus: 'accepted' },
      { email: 'client@company.com', responseStatus: 'needsAction' },
    ],
  },
]

const panelLayout: PanelGroup = {
  id: 'demo-workspace',
  type: 'panel',
  panel: {
    id: 'workspace-1',
    activeTabId: 'tab-1',
    tabs: [
      {
        id: 'tab-1',
        fileName: 'Q3-Product-Strategy.docx',
        filePath: '/documents/Q3-Product-Strategy.docx',
        fileType: 'document',
        file: mockFile,
        type: 'file',
      },
      {
        id: 'tab-2',
        fileName: 'demo.tsx',
        filePath: '/projects/demo.tsx',
        fileType: 'typescript',
        file: mockFile2,
        type: 'file',
      },
      {
        id: 'tab-3',
        title: 'Team Meeting',
        type: 'calendar',
      },
    ],
  },
  size: 50,
}

// Store original service methods to restore later
let originalIsFeatureAvailable: typeof ScopeService.isFeatureAvailable
let originalGetUserFiles: typeof ApiService.getUserFiles
let originalListFiles: typeof DriveService.listFiles
let originalListMessages: typeof EmailService.listMessages
let originalGetMessagesBatch: typeof EmailService.getMessagesBatch
let originalListEvents: typeof CalendarService.listEvents

// Setup mocks function - called before component renders
function setupDemoMocks() {
  // Save originals
  originalIsFeatureAvailable = ScopeService.isFeatureAvailable
  originalGetUserFiles = ApiService.getUserFiles
  originalListFiles = DriveService.listFiles
  originalListMessages = EmailService.listMessages
  originalGetMessagesBatch = EmailService.getMessagesBatch
  originalListEvents = CalendarService.listEvents

  // Mock ScopeService - make all features available
  ScopeService.isFeatureAvailable = async (feature: string) => {
    return true
  }

  // Mock ApiService - local/S3 files
  ApiService.getUserFiles = async (username: string) => {
    return {
      success: true,
      files: mockLocalFiles,
    }
  }

  // Mock DriveService
  DriveService.listFiles = async () => {
    return {
      files: mockDriveFiles,
      nextPageToken: undefined,
    }
  }

  // Mock EmailService
  EmailService.listMessages = async () => {
    return {
      messages: mockEmailMessages.map(msg => ({ id: msg.id, threadId: msg.threadId })),
      nextPageToken: undefined,
      resultSizeEstimate: mockEmailMessages.length,
    }
  }
  EmailService.getMessagesBatch = async (messageIds: string[]) => {
    return mockEmailMessages.filter(msg => messageIds.includes(msg.id))
  }

  // Mock CalendarService
  CalendarService.listEvents = async () => {
    return {
      items: mockCalendarEvents,
      nextPageToken: undefined,
    }
  }
}

// Cleanup mocks function
function cleanupDemoMocks() {
  ScopeService.isFeatureAvailable = originalIsFeatureAvailable
  ApiService.getUserFiles = originalGetUserFiles
  DriveService.listFiles = originalListFiles
  EmailService.listMessages = originalListMessages
  EmailService.getMessagesBatch = originalGetMessagesBatch
  CalendarService.listEvents = originalListEvents
}

export default function DemoApp() {
  // Setup mocks immediately on first render using lazy initialization
  const [mocksReady] = useState(() => {
    setupDemoMocks()
    // Set a global flag to indicate demo mode is active
    if (typeof window !== 'undefined') {
      (window as any).__DEMO_MODE_ACTIVE__ = true
    }
    return true
  })
  const [isFileSidebarCollapsed, setIsFileSidebarCollapsed] = useState(false)
  const [isAssistantPanelCollapsed, setIsAssistantPanelCollapsed] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(mockFile)
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null)
  const [conversations, setConversations] = useState(mockConversations)
  const [panelLayoutState, setPanelLayoutState] = useState<PanelGroup>(panelLayout)

  // Cleanup mocks on unmount
  useEffect(() => {
    return () => {
      cleanupDemoMocks()
      // Clear the global flag when demo mode ends
      if (typeof window !== 'undefined') {
        (window as any).__DEMO_MODE_ACTIVE__ = false
      }
    }
  }, [])

  const handleToggleFileSidebar = () => {
    setIsFileSidebarCollapsed(!isFileSidebarCollapsed)
  }

  const handleToggleAssistantPanel = () => {
    setIsAssistantPanelCollapsed(!isAssistantPanelCollapsed)
  }

  const handleFileSelect = (file: FileSystemItem) => {
    setSelectedFile(file)
    console.log('File selected:', file)
  }

  const handleEmailSelect = (email: any) => {
    setSelectedEmail(email)
    console.log('Email selected:', email)
  }

  const handleEventSelect = (event: any) => {
    console.log('Event selected:', event)
  }

  const handleLoadConversation = (conversationId: string) => {
    console.log('Loading conversation:', conversationId)
  }

  const handleDeleteConversation = (conversationId: string) => {
    setConversations(conversations.filter(conv => conv._id !== conversationId))
    console.log('Deleted conversation:', conversationId)
  }

  const handleClearConversation = () => {
    console.log('Clearing conversation')
  }

  const handleTabChange = (tabId: string) => {
    setPanelLayoutState(prev => {
      if (prev.type === 'panel' && prev.panel) {
        return {
          ...prev,
          panel: {
            ...prev.panel,
            activeTabId: tabId
          }
        }
      }
      return prev
    })
  }

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPanelLayoutState(prev => {
      if (prev.type === 'panel' && prev.panel) {
        const newTabs = prev.panel.tabs.filter(tab => tab.id !== tabId)
        let newActiveTabId = prev.panel.activeTabId
        
        if (prev.panel.activeTabId === tabId && newTabs.length > 0) {
          newActiveTabId = newTabs[0].id
        } else if (newTabs.length === 0) {
          newActiveTabId = null
        }
        
        return {
          ...prev,
          panel: {
            ...prev.panel,
            tabs: newTabs,
            activeTabId: newActiveTabId
          }
        }
      }
      return prev
    })
  }

  const getTabIcon = (tab: WorkspaceTab) => {
    switch (tab.type) {
      case 'file':
        return <FileText className="h-3 w-3" />
      case 'email':
        return <Mail className="h-3 w-3" />
      case 'calendar':
        return <Calendar className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const getTabTitle = (tab: WorkspaceTab) => {
    switch (tab.type) {
      case 'file':
        return tab.fileName
      case 'email':
        return tab.subject
      case 'calendar':
        return tab.title
      default:
        return 'Untitled'
    }
  }

  const renderPanelGroup = (group: PanelGroup) => {
    if (group.type === 'panel' && group.panel) {
      const { panel } = group
      const activeTab = panel.tabs.find(tab => tab.id === panel.activeTabId)
      
      return (
        <div className="h-full flex flex-col bg-background">
          {/* Tab Bar */}
          {panel.tabs.length > 0 && (
            <div className="flex items-center border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 overflow-x-auto">
              {panel.tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-r border-zinc-200 dark:border-zinc-700 
                    hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group relative min-w-fit
                    ${panel.activeTabId === tab.id 
                      ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white' 
                      : 'text-zinc-600 dark:text-zinc-400'
                    }
                  `}
                >
                  {getTabIcon(tab)}
                  <span className="truncate max-w-[100px] sm:max-w-[120px] md:max-w-[150px]">{getTabTitle(tab)}</span>
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="ml-1 sm:ml-2 opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded p-0.5 transition-opacity"
                    title="Close tab"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {!activeTab ? (
              <div className="h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="text-center text-sm sm:text-base text-zinc-500">No active tab</div>
              </div>
            ) : activeTab.type === 'file' ? (
              <div className="h-full flex flex-col bg-white overflow-auto">
            {/* Document Editor */}
            <div className="flex-1 overflow-auto">
              {/* Document Page */}
              <div className="max-w-4xl mx-auto my-4 sm:my-6 md:my-8 bg-white shadow-lg min-h-[400px] sm:min-h-[500px] md:min-h-[600px] p-4 sm:p-8 md:p-12 lg:p-16">
                {/* Document Content */}
                <div className="space-y-4 sm:space-y-5 md:space-y-6 font-sans text-zinc-900">
                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 mb-4 sm:mb-6 md:mb-8">
                    Q3 Product Strategy Proposal
                  </h1>
                  
                  {/* Metadata */}
                  <div className="text-xs sm:text-sm text-zinc-500 border-b pb-3 sm:pb-4 mb-4 sm:mb-6">
                    <p>Author: Sarah Chen</p>
                    <p>Date: October 22, 2025</p>
                    <p>Department: Product Management</p>
                  </div>

                  {/* Executive Summary */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 mb-2 sm:mb-3">
                      Executive Summary
                    </h2>
                    <p className="text-sm sm:text-base leading-relaxed text-zinc-700">
                      This document outlines our strategic approach for Q3 2025, focusing on three key initiatives: 
                      expanding our AI-powered features, improving user onboarding experience, and strengthening our 
                      enterprise offerings. Our analysis indicates a significant market opportunity in the SMB segment, 
                      with projected growth of 45% year-over-year.
                    </p>
                  </div>

                  {/* Market Analysis */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 mb-2 sm:mb-3">
                      Market Analysis
                    </h2>
                    <p className="text-sm sm:text-base leading-relaxed text-zinc-700 mb-3 sm:mb-4">
                      Recent market research reveals several compelling trends that inform our strategic direction:
                    </p>
                    <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-zinc-700 text-sm sm:text-base">
                      <li className="leading-relaxed">
                        AI adoption in productivity tools has increased by 230% in the past year
                      </li>
                      <li className="leading-relaxed">
                        Customer demand for integrated workflows continues to grow, with 78% of surveyed users 
                        preferring all-in-one solutions
                      </li>
                      <li className="leading-relaxed">
                        Enterprise clients are willing to pay a 40% premium for advanced collaboration features
                      </li>
                    </ul>
                  </div>

                  {/* Key Initiatives */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 mb-2 sm:mb-3">
                      Key Initiatives
                    </h2>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-zinc-800 mb-1.5 sm:mb-2">
                          1. AI-Powered Content Generation
                        </h3>
                        <p className="text-sm sm:text-base leading-relaxed text-zinc-700 bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4">
                          <span className="font-medium">Timeline:</span> Launch in 6 weeks
                          <br />
                          <span className="font-medium">Investment:</span> $2.5M
                          <br />
                          <span className="font-medium">Expected ROI:</span> 180% within first year
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-zinc-800 mb-1.5 sm:mb-2">
                          2. Enhanced User Onboarding
                        </h3>
                        <p className="text-sm sm:text-base leading-relaxed text-zinc-700">
                          We will implement an interactive tutorial system that reduces time-to-value by 60%. 
                          Early testing shows a 35% improvement in user activation rates.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-zinc-800 mb-1.5 sm:mb-2">
                          3. Enterprise Security Suite
                        </h3>
                        <p className="text-sm sm:text-base leading-relaxed text-zinc-700">
                          SOC 2 Type II compliance, advanced SSO integration, and comprehensive audit logging 
                          will position us competitively in the enterprise market.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Success Metrics */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 mb-2 sm:mb-3">
                      Success Metrics
                    </h2>
                    <div className="bg-zinc-50 p-3 sm:p-4 rounded border">
                      <ul className="space-y-2 text-zinc-700 text-sm sm:text-base">
                        <li className="flex justify-between gap-2">
                          <span>Monthly Active Users Growth:</span>
                          <span className="font-semibold">+25%</span>
                        </li>
                        <li className="flex justify-between gap-2">
                          <span>Customer Satisfaction Score:</span>
                          <span className="font-semibold">8.5/10</span>
                        </li>
                        <li className="flex justify-between gap-2">
                          <span>Revenue Target:</span>
                          <span className="font-semibold">$12.5M</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Conclusion */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 mb-2 sm:mb-3">
                      Conclusion
                    </h2>
                    <p className="text-sm sm:text-base leading-relaxed text-zinc-700">
                      By executing on these initiatives, we position ourselves to capture significant market share 
                      while delivering exceptional value to our customers. The proposed investments align with our 
                      long-term vision and provide clear pathways to profitability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
            ) : activeTab.type === 'email' ? (
              <div className="h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">{(activeTab as any).subject}</h2>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">Email content would be displayed here</p>
                </div>
              </div>
            ) : activeTab.type === 'calendar' ? (
              <div className="h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">{(activeTab as any).title}</h2>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">Calendar event details would be displayed here</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <DemoRuntimeProvider>
      <TooltipProvider>
        <div 
          className="w-full flex items-center justify-center py-10 sm:py-12 md:py-14 lg:py-16 px-4 sm:px-4 relative"
          style={{
            backgroundImage: 'url(/wheat-field-wallpaper-mural-plain.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Artistic overlay for painted effect */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(255,182,193,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(173,216,230,0.3) 0%, transparent 50%)',
              mixBlendMode: 'soft-light'
            }}
          />
          
          <div className="h-[500px] sm:h-[600px] lg:h-[600px] w-full max-w-7xl flex overflow-hidden rounded-lg sm:rounded-xl border border-white/10 sm:border-2 shadow-xl sm:shadow-2xl bg-zinc-900/50 backdrop-blur-sm relative z-10">
        {/* Left Panel */}
        {!isFileSidebarCollapsed && (
          <div className="w-60 sm:w-64 md:w-72 lg:w-80 h-full flex-shrink-0 hidden md:block">
            <LeftPanel 
              currentView="workspaces"
              userInfo={mockUserInfo}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onEmailSelect={handleEmailSelect}
              onEventSelect={handleEventSelect}
              onComposeEmail={() => console.log('Compose email')}
              onCreateDocument={(name) => console.log('Create document:', name)}
              onCreateSpreadsheet={(name) => console.log('Create spreadsheet:', name)}
              onCreateNotebook={(name) => console.log('Create notebook:', name)}
              onCreateDrawio={(name) => console.log('Create diagram:', name)}
              onCreateTldraw={(name) => console.log('Create drawing:', name)}
              onCreateFolder={() => console.log('Create folder')}
              onGenerateImage={() => console.log('Generate image')}
              onOpenCalendar={() => console.log('Open calendar')}
            />
          </div>
        )}

        {/* Middle Panel */}
        <div className="flex-1 h-full min-w-0">
          <MiddlePanel 
            isFileSidebarCollapsed={isFileSidebarCollapsed}
            isAssistantPanelCollapsed={isAssistantPanelCollapsed}
            panelLayout={panelLayoutState}
            onToggleFileSidebar={handleToggleFileSidebar}
            onToggleAssistantPanel={handleToggleAssistantPanel}
            renderPanelGroup={renderPanelGroup}
          />
        </div>

        {/* Right Panel */}
        {!isAssistantPanelCollapsed && (
          <div className="w-60 sm:w-64 md:w-72 lg:w-80 h-full flex-shrink-0 hidden lg:block">
            <RightPanel 
              userInfo={mockUserInfo}
              selectedFile={selectedFile}
              selectedEmail={selectedEmail}
              conversations={conversations}
              isLoadingConversations={false}
              onToggleCollapse={handleToggleAssistantPanel}
              onLoadConversation={handleLoadConversation}
              onDeleteConversation={handleDeleteConversation}
              onClearConversation={handleClearConversation}
              onEmailSelect={handleEmailSelect}
            />
          </div>
        )}
        </div>
        </div>
      </TooltipProvider>
    </DemoRuntimeProvider>
  )
}