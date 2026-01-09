import { Allotment } from 'allotment';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ClaudeRuntimeProvider } from '../../assistant/ClaudeRuntimeProvider/ClaudeRuntimeProvider';
import { LeftPanel } from "../../components/LeftPanel/LeftPanel";
import { MiddlePanel } from "../../components/MiddlePanel/MiddlePanel";
import { NavSidebar } from "../../components/nav-sidebar";
import { WorkspacesTopBar } from "../../components/WorkspacesTopBar/WorkspacesTopBar";
import { FileSystemItem } from '../../utils/fileTreeUtils';
import 'allotment/dist/style.css';
import { X, FolderOpen, Trash2, Menu, Files, MessageSquare, Brain, LogOut, UserStarIcon, PanelRight } from 'lucide-react';
import BanburyLogo from '../../assets/images/Logo.png';
import { SplitZones } from '../../components/common/SplitZones';
import { useRouter } from 'next/router';
import { useIsMobile } from '../../hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Button } from '../../components/ui/button';
import { dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { TiptapAIProvider } from '../../contexts/TiptapAIContext';
import { TooltipProvider } from "../../components/ui/tooltip";
import { Toaster } from "../../components/ui/toaster";
import { useToast } from "../../components/ui/use-toast";
import { ApiService } from '../../../backend/api/apiService';
import { AdminContent } from "../../components/AdminContent/AdminContent";
import { extractEmailContent } from '../../utils/emailUtils';
import { handleCreateSpreadsheet } from './handlers/handleCreateSpreadsheet';
import { handleCreateWordDocument } from './handlers/handleCreateWordDocument';
import { handleCreateNotebook } from './handlers/handleCreateNotebook';
import { handleCreateDrawio } from './handlers/handleCreateDrawio';
import { handleCreateTldraw } from './handlers/handleCreateTldraw';
import { handleCreatePowerpoint } from './handlers/handleCreatePowerpoint';
import { handleCreateImage } from './handlers/handleCreateImage';
import { renderPanel } from './handlers/renderPanel';
import { handleFileMoved } from './handlers/handleFileMoved';
import { handleFolderRenamed } from './handlers/handleFolderRenamed';
import { handleFileDeleted } from './handlers/handleFileDeleted';
import { handleFileRenamed } from './handlers/handleFileRenamed';
import { splitPanel } from './handlers/splitPanel';
import { openCalendarInTab } from './handlers/openCalendarInTab';
import { handleCalendarEventSelect } from './handlers/handleCalendarEventSelect';
import { handleReplyToEmail } from './handlers/handleReplyToEmail';
import { handleComposeEmail } from './handlers/handleComposeEmail';
import { loadConversations, saveCurrentConversation, loadConversation, deleteConversation } from './handlers/conversationManagement';
import { findPanel, getAllTabs, updatePanelActiveTab, addTabToPanel, removeTabFromPanel } from './handlers/panelUtils';
import { openFileInTab, openEmailInTab, openTaskInTab, openMeetingInTab, openAdminInTab, handleCloseTab, handleTabChange } from './handlers/tabManagement';
import { isDrawioFile, isTldrawFile, isPowerPointFile } from './handlers/fileTypeUtils';
import { createWorkspacesKeyboardHandler } from './handlers/createWorkspacesKeyboardHandler';
import { Kbd, KbdGroup } from '../../components/ui/kbd';
import { renderAssistantPanel } from './handlers/renderAssistantPanel';
import { useLeftPanelResize } from './handlers/handleLeftPanelResize';
import { 
  getStoredKeybinds, 
  getActiveKey,
  KeybindsState 
} from '../../components/modals/settings-tabs/handlers/keybindHandlers';
import { FileSearchCommand } from '../../components/FileSearchCommand';
import { EmailSearchResult } from '../../components/handlers/file-search-command-handlers';
import { CalendarEvent } from '../../../backend/api/calendar/calendar';
import { Task } from '../../pages/TaskStudio/types';
import { MeetingSession } from '../../types/meeting-types';
import {
  UserInfo,
  FileTab,
  WorkspaceTab,
  Panel,
  SplitDirection,
  PanelGroup,
  AiTab,
  DragState,
} from './types';
import { createInitialAiTab, createAiTab } from '../../components/RightPanel/handlers/aiTabHandlers';
import { isDefaultAiTabLabel, deriveAiTabTitleFromText } from '../../components/RightPanel/handlers/aiTabTitle';
import { subscribeTodoEventListener } from '../../components/RightPanel/handlers/todoStoreHandlers';




const Workspaces = (): React.ReactNode => {
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingSession | null>(null);
  const [uploading, setUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [folderCreationTrigger, setFolderCreationTrigger] = useState<boolean>(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  const [replyToEmail, setReplyToEmail] = useState<any>(null);
  const [activePanelId, setActivePanelId] = useState<string>('main-panel');
  const [isFileSidebarCollapsed, setIsFileSidebarCollapsed] = useState(false);
  const [isAssistantPanelCollapsed, setIsAssistantPanelCollapsed] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [fileSearchOpen, setFileSearchOpen] = useState(false);
  const [activeLeftPanelTab, setActiveLeftPanelTab] = useState<string>('files');

  // Left panel resize functionality
  const { leftPanelWidth, isResizing, handleResizeStart } = useLeftPanelResize({
    isFileSidebarCollapsed,
    defaultWidth: 320,
    minWidth: 200,
    maxWidth: 600,
  });
  // Mobile state management
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileFileSidebarOpen, setMobileFileSidebarOpen] = useState(false);
  const [mobileAssistantOpen, setMobileAssistantOpen] = useState(false);
  const [keybinds, setKeybinds] = useState<KeybindsState>(getStoredKeybinds);
  const [calendarJumpDate, setCalendarJumpDate] = useState<Date | null>(null);
  const [calendarSelectedEvent, setCalendarSelectedEvent] = useState<CalendarEvent | null>(null);
  const [panelLayout, setPanelLayout] = useState<PanelGroup>({
    id: 'root',
    type: 'panel',
    panel: {
      id: 'main-panel',
      tabs: [],
      activeTabId: null
    }
  });
  
  // Assistant panel dock layout - mirrors panelLayout structure for the right panel
  const initialAiTab = createInitialAiTab();
  const [assistantDockLayout, setAssistantDockLayout] = useState<PanelGroup>({
    id: 'assistant-root',
    type: 'panel',
    panel: {
      id: 'assistant-main-panel',
      tabs: [initialAiTab],
      activeTabId: initialAiTab.id
    }
  });
  const [activeAssistantPanelId, setActiveAssistantPanelId] = useState<string>('assistant-main-panel');

  // Listen for title candidate events and update AI tab labels
  useEffect(() => {
    const handleTitleCandidate = (event: Event) => {
      const { tabId, text } = (event as CustomEvent).detail || {}
      if (!tabId || !text) return

      const derivedTitle = deriveAiTabTitleFromText(text)
      if (!derivedTitle) return

      setAssistantDockLayout((prev) => {
        const updatePanel = (panel: Panel): Panel => ({
          ...panel,
          tabs: panel.tabs.map((tab) => {
            if (tab.type === 'ai' && tab.id === tabId && isDefaultAiTabLabel(tab.label)) {
              return { ...tab, label: derivedTitle }
            }
            return tab
          })
        })

        const updateGroup = (group: PanelGroup): PanelGroup => {
          if (group.type === 'panel' && group.panel) {
            return { ...group, panel: updatePanel(group.panel) }
          }
          if (group.type === 'split' && group.children) {
            return { ...group, children: group.children.map(updateGroup) }
          }
          return group
        }

        return updateGroup(prev)
      })
    }

    window.addEventListener('assistant-ai-tab-title-candidate', handleTitleCandidate)
    return () => {
      window.removeEventListener('assistant-ai-tab-title-candidate', handleTitleCandidate)
    }
  }, [])

  // Subscribe to todo events for plan execution
  useEffect(() => {
    const unsubscribe = subscribeTodoEventListener()
    return unsubscribe
  }, [])
  
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
    panelId: string;
  } | null>(null);
  

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTab: null,
    draggedFromPanel: null,
    dragStartPosition: null,
    currentPosition: null,
    dragDirection: null,
    dropZone: null,
    dropTargetPanel: null,
  });
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;



  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return imageExtensions.includes(extension)
  };

  const isPdfFile = (fileName: string): boolean => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return extension === '.pdf'
  };

  const isDocumentFile = (fileName: string): boolean => {
    const documentExtensions = ['.docx', '.doc', '.txt', '.rtf', '.odt']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return documentExtensions.includes(extension)
  };

  const isSpreadsheetFile = (fileName: string): boolean => {
    const spreadsheetExtensions = ['.csv', '.xlsx', '.xls']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return spreadsheetExtensions.includes(extension)
  };

  const isVideoFile = (fileName: string): boolean => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    const isVideo = videoExtensions.includes(extension)
    return isVideo
  };

  const isCodeFile = (fileName: string): boolean => {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
      '.html', '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash', '.zsh', '.fish',
      '.sql', '.r', '.m', '.mat', '.ipynb', '.jl', '.dart', '.lua', '.pl', '.pm', '.tcl', '.vbs', '.ps1', '.bat', '.cmd', '.coffee', '.litcoffee', '.iced',
      '.md', '.markdown', '.tex', '.rtex', '.bib', '.vue', '.svelte'
    ]
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return codeExtensions.includes(extension)
  };

  const isBrowserFile = (fileName: string): boolean => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return extension === '.browserbase'
  };

  const isViewableFile = (fileName: string): boolean => {
    return isBrowserFile(fileName) || isImageFile(fileName) || isPdfFile(fileName) || isDocumentFile(fileName) || isSpreadsheetFile(fileName) || isVideoFile(fileName) || isCodeFile(fileName) || isDrawioFile(fileName) || isTldrawFile(fileName) || isPowerPointFile(fileName)
  };

  const loadConversationsCallback = async () => {
    await loadConversations(setIsLoadingConversations, setConversations);
  };

  const saveCurrentConversationCallback = async () => {
    await saveCurrentConversation(userInfo, conversationTitle, setSaveDialogOpen, setConversationTitle, loadConversationsCallback, toast);
  };

  const loadConversationCallback = async (conversationId: string, tabId?: string) => {
    await loadConversation(conversationId, setShowConversationDialog, toast, tabId);
  };

  const deleteConversationCallback = async (conversationId: string) => {
    await deleteConversation(conversationId, loadConversationsCallback);
  };

  const openFileInTabCallback = useCallback((file: FileSystemItem, targetPanelId: string = activePanelId) => {
    openFileInTab(
      file,
      targetPanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout,
      setSelectedFile
    );
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout, setSelectedFile]);

  const handleFileSelect = useCallback((file: FileSystemItem) => {
    // Check if it's a Drive file
    const isDriveFile = file.path?.startsWith('drive://')
    
    // For Drive files, check mimeType; for local files, check extension
    let viewable = false
    if (isDriveFile) {
      // Google Workspace files are always viewable (Docs, Sheets, Slides)
      if (file.mimeType?.includes('vnd.google-apps')) {
        viewable = true
      } else {
        // Check other Drive file types (images, PDFs, videos, documents, spreadsheets, presentations, etc)
        viewable = !!(file.mimeType && (
          file.mimeType.includes('image/') ||
          file.mimeType.includes('pdf') ||
          file.mimeType.includes('video/') ||
          file.mimeType.includes('text/') ||
          file.mimeType.includes('msword') ||
          file.mimeType.includes('wordprocessingml') ||
          file.mimeType.includes('excel') ||
          file.mimeType.includes('spreadsheetml') ||
          file.mimeType.includes('csv') ||
          file.mimeType.includes('presentationml') ||
          file.mimeType.includes('ms-powerpoint')
        ))
      }
    } else {
      viewable = isViewableFile(file.name)
    }
    
    if (!viewable) {
      setSelectedFile(file);
      return;
    }
    
    openFileInTabCallback(file, activePanelId);
  }, [activePanelId, openFileInTabCallback, isViewableFile, setSelectedFile]);

  const openEmailInTabCallback = useCallback((email: any, targetPanelId: string = activePanelId) => {
    openEmailInTab(
      email,
      targetPanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout,
      setSelectedEmail
    );
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout, setSelectedEmail]);

  const openAdminInTabCallback = useCallback((adminTabType: string, targetPanelId: string = activePanelId) => {
    openAdminInTab(
      adminTabType,
      targetPanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout
    );
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout]);

  const handleCloseTabCallback = useCallback((tabId: string, panelId: string) => {
    handleCloseTab(tabId, panelId, findPanel, removeTabFromPanel, setPanelLayout, setSelectedFile, setSelectedEmail);
  }, [findPanel, removeTabFromPanel, setPanelLayout, setSelectedFile, setSelectedEmail]);

  const handleTabChangeCallback = useCallback((panelId: string, tabId: string) => {
    handleTabChange(panelId, tabId, panelLayout, findPanel, updatePanelActiveTab, setPanelLayout, setActivePanelId, setSelectedFile, setSelectedEmail);
  }, [panelLayout, findPanel, updatePanelActiveTab, setPanelLayout, setActivePanelId, setSelectedFile, setSelectedEmail]);
  
  const splitPanelCallback = useCallback((panelId: string, direction: SplitDirection, newFileTab?: FileTab) => {
    splitPanel(panelId, direction, newFileTab, setPanelLayout, setActivePanelId, setSelectedFile);
  }, [setPanelLayout, setActivePanelId, setSelectedFile]);

  const openCalendarInTabCallback = useCallback((targetPanelId: string = activePanelId) => {
    openCalendarInTab(targetPanelId, activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout);
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout]);

  // Handler for email selection from command palette
  const handleSearchEmailSelect = useCallback((email: EmailSearchResult) => {
    // The EmailSearchResult from the search has the same structure as the full email
    openEmailInTabCallback(email, activePanelId);
  }, [openEmailInTabCallback, activePanelId]);

  // Handler for calendar event selection (shared by command palette and left panel)
  const handleCalendarEventSelectCallback = useCallback((event: CalendarEvent) => {
    handleCalendarEventSelect({
      event,
      setCalendarJumpDate,
      setCalendarSelectedEvent,
      openCalendarInTabCallback,
      activePanelId
    })
  }, [openCalendarInTabCallback, activePanelId]);
  
  // Split preview while dragging is controlled by the Olympus Tabs component via onSplitPreview
  
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);
  
  // Function to trigger sidebar refresh
  const triggerSidebarRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Helper function to extract and format email body for replies
  const extractReplyBody = useCallback((email: any): string => {
    if (!email?.payload) return '';
    
    // Extract full email content
    const emailContent = extractEmailContent(email.payload);
    
    // Prefer HTML content if available, otherwise use text
    let body = emailContent.html || emailContent.text || email.snippet || '';
    
    // If we have HTML content, clean it up for reply formatting
    if (emailContent.html) {
      // Remove excessive styling but keep structure
      body = body
        .replace(/style="[^"]*"/g, '') // Remove inline styles
        .replace(/class="[^"]*"/g, '') // Remove classes
        .replace(/<div[^>]*>/g, '<p>') // Convert divs to paragraphs
        .replace(/<\/div>/g, '</p>') // Close paragraphs
        .replace(/<br\s*\/?>/g, '<br>') // Normalize line breaks
        .replace(/<p><\/p>/g, '') // Remove empty paragraphs
        .replace(/<p><br><\/p>/g, '<br>') // Convert empty paragraphs to line breaks
        .trim();
    } else if (emailContent.text) {
      // For plain text, preserve line breaks
      body = emailContent.text
        .replace(/\n/g, '<br>') // Convert newlines to HTML line breaks
        .trim();
    }
    
    return body;
  }, []);

  // Handle reply to email - opens a new compose tab
  const handleReplyToEmailCallback = useCallback((email: any) => {
    handleReplyToEmail(email, activePanelId, addTabToPanel, setPanelLayout, setActivePanelId, setReplyToEmail);
  }, [activePanelId, addTabToPanel, setPanelLayout, setActivePanelId, setReplyToEmail]);

  
  // Clear the calendar jump date after it's been consumed
  const handleCalendarJumpComplete = useCallback(() => {
    setCalendarJumpDate(null);
  }, []);

  // Clear the calendar selected event after it's been consumed
  const handleCalendarSelectedEventConsumed = useCallback(() => {
    setCalendarSelectedEvent(null);
  }, []);

  // Handle email selection from EmailTab - now opens in tabs
  const handleEmailSelect = useCallback((email: any) => {
    setSelectedEmail(email);
    openEmailInTabCallback(email, activePanelId);
  }, [openEmailInTabCallback, activePanelId]);

  // Render a single panel - using extracted function
  const renderPanelWrapper = useCallback((panel: Panel) => {
    return renderPanel({
      panel,
      activePanelId,
      dragState,
      userInfo,
      replyToEmail,
      setActivePanelId,
      handleTabChange: handleTabChangeCallback,
      handleCloseTab: handleCloseTabCallback,
      handleReplyToEmail: handleReplyToEmailCallback,
      triggerSidebarRefresh,
      extractReplyBody,
      isImageFile,
      isPdfFile,
      isDocumentFile,
      isSpreadsheetFile,
      isVideoFile,
      isCodeFile,
      isBrowserFile,
      isDrawioFile,
      isTldrawFile,
      isPowerPointFile,
      setPanelLayout,
      onSplitPreview: (direction, position) => {
        // Update drag state with split preview information
        setDragState(prev => ({
          ...prev,
          dragDirection: direction,
          currentPosition: position,
        }));
      },
      calendarJumpDate,
      onCalendarJumpComplete: handleCalendarJumpComplete,
      calendarSelectedEvent,
      onCalendarSelectedEventConsumed: handleCalendarSelectedEventConsumed,
      selectedFile,
      selectedEmail,
      onEmailSelect: handleEmailSelect,
      onClearConversation: (tabId: string) => {
        window.dispatchEvent(new CustomEvent('clear-conversation', { detail: { tabId } }));
      },
    });
  }, [activePanelId, dragState, userInfo, replyToEmail, setActivePanelId, handleTabChangeCallback, handleCloseTabCallback, handleReplyToEmailCallback, triggerSidebarRefresh, extractReplyBody, isImageFile, isPdfFile, isDocumentFile, isSpreadsheetFile, isVideoFile, isCodeFile, isBrowserFile, isDrawioFile, isTldrawFile, isPowerPointFile, setPanelLayout, setDragState, calendarJumpDate, handleCalendarJumpComplete, calendarSelectedEvent, handleCalendarSelectedEventConsumed, selectedFile, selectedEmail, handleEmailSelect]);
  
  // Render panel group (recursive for nested splits)
  const renderPanelGroup = useCallback((group: PanelGroup): React.ReactNode => {
    if (group.type === 'panel' && group.panel) {
      return renderPanelWrapper(group.panel);
    }
    
    if (group.type === 'group' && group.children) {
      return (
        <Allotment
          vertical={group.direction === 'vertical'}
          proportionalLayout={true}
          defaultSizes={group.children.map((child) => child.size || 50)}
          key={group.id}
          className="h-full"
        >
          {group.children.map((child) => (
            <Allotment.Pane key={child.id}>
              {renderPanelGroup(child)}
            </Allotment.Pane>
          ))}
        </Allotment>
      );
    }
    
    // Helper to render a keybind display
    const renderKeybind = (keyString: string) => {
      const hasShift = keyString.includes('shift+')
      const key = keyString.replace('shift+', '').toUpperCase()
      
      return (
        <KbdGroup>
          <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
          {hasShift && (
            <>
              <span className="text-muted-foreground">+</span>
              <Kbd>{isMac ? '⇧' : 'Shift'}</Kbd>
            </>
          )}
          <span className="text-muted-foreground">+</span>
          <Kbd>{key}</Kbd>
        </KbdGroup>
      )
    }

    const newAgentKey = getActiveKey(keybinds.newAgent)
    const searchFilesKey = getActiveKey(keybinds.searchFiles)
    const toggleSidebarKey = getActiveKey(keybinds.toggleFileSidebar)
    const toggleSidebarAltKey = getActiveKey(keybinds.toggleFileSidebarAlt)

    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
        <Image 
          src={BanburyLogo} 
          alt="Banbury" 
          className="opacity-20 dark:opacity-15"
          width={isMobile ? 60 : 80}
          height={isMobile ? 60 : 80}
          priority
        />
        <div className="flex flex-col items-center gap-4 max-w-md w-full">
          {!isMobile ? (
            <>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Create a new agent</p>
                {renderKeybind(newAgentKey)}
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Search files</p>
                {renderKeybind(searchFilesKey)}
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Toggle file sidebar</p>
                <div className="flex items-center gap-2">
                  {renderKeybind(toggleSidebarKey)}
                  <span className="text-xs text-muted-foreground">or</span>
                  {renderKeybind(toggleSidebarAltKey)}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground mobile-text">Tap the menu buttons above to get started</p>
              <p className="text-xs text-muted-foreground mobile-text">Use the Files button to browse your workspace</p>
            </div>
          )}
        </div>
      </div>
    );
  }, [renderPanelWrapper, isMac, keybinds, isMobile]);

  // Assistant panel tab handlers
  const handleAssistantTabChange = useCallback((panelId: string, tabId: string) => {
    setAssistantDockLayout((prev) => {
      const updateActive = (layout: PanelGroup): PanelGroup => {
        if (layout.type === 'panel' && layout.panel?.id === panelId) {
          return {
            ...layout,
            panel: { ...layout.panel, activeTabId: tabId }
          };
        }
        if (layout.type === 'group' && layout.children) {
          return { ...layout, children: layout.children.map(updateActive) };
        }
        return layout;
      };
      return updateActive(prev);
    });
    setActiveAssistantPanelId(panelId);
  }, []);

  const handleAssistantTabClose = useCallback((tabId: string, panelId: string) => {
    setAssistantDockLayout((prev) => removeTabFromPanel(prev, panelId, tabId));
  }, [removeTabFromPanel]);

  const handleAssistantTabAdd = useCallback((panelId: string, label?: string) => {
    const newTab = createAiTab(label);
    setAssistantDockLayout((prev) => addTabToPanel(prev, panelId, newTab));
  }, [addTabToPanel]);

  const handleAssistantTabReorder = useCallback((panelId: string, sourceIndex: number, destinationIndex: number) => {
    setAssistantDockLayout((prev) => {
      const reorderInLayout = (layout: PanelGroup): PanelGroup => {
        if (layout.type === 'panel' && layout.panel?.id === panelId) {
          const newTabs = [...layout.panel.tabs];
          const [moved] = newTabs.splice(sourceIndex, 1);
          newTabs.splice(destinationIndex, 0, moved);
          return { ...layout, panel: { ...layout.panel, tabs: newTabs } };
        }
        if (layout.type === 'group' && layout.children) {
          return { ...layout, children: layout.children.map(reorderInLayout) };
        }
        return layout;
      };
      return reorderInLayout(prev);
    });
  }, []);

  // Render a single assistant panel
  const renderAssistantPanelWrapper = useCallback((panel: Panel) => {
    return renderAssistantPanel({
      panel,
      activePanelId: activeAssistantPanelId,
      dragState,
      userInfo,
      selectedFile,
      selectedEmail,
      conversations,
      isLoadingConversations,
      setActivePanelId: setActiveAssistantPanelId,
      handleTabChange: handleAssistantTabChange,
      handleCloseTab: handleAssistantTabClose,
      handleTabAdd: handleAssistantTabAdd,
      handleTabReorder: handleAssistantTabReorder,
      onLoadConversation: loadConversationCallback,
      onDeleteConversation: deleteConversationCallback,
      onClearConversation: (tabId: string) => {
        window.dispatchEvent(new CustomEvent('clear-conversation', { detail: { tabId } }));
      },
      onEmailSelect: handleEmailSelect,
      setAssistantDockLayout,
      assistantDockLayout,
      onSplitPreview: (direction, position) => {
        setDragState((prev) => ({
          ...prev,
          dragDirection: direction,
          currentPosition: position,
        }));
      },
      splitPreviewBoundsSelector: '[data-assistant-dock]',
    });
  }, [activeAssistantPanelId, dragState, userInfo, selectedFile, selectedEmail, conversations, isLoadingConversations, handleAssistantTabChange, handleAssistantTabClose, handleAssistantTabAdd, handleAssistantTabReorder, loadConversationCallback, deleteConversationCallback, handleEmailSelect, setAssistantDockLayout, assistantDockLayout]);

  // Render assistant panel group (recursive for nested splits)
  const renderAssistantPanelGroup = useCallback((group: PanelGroup): React.ReactNode => {
    if (group.type === 'panel' && group.panel) {
      return renderAssistantPanelWrapper(group.panel);
    }
    
    if (group.type === 'group' && group.children) {
      return (
        <Allotment
          vertical={group.direction === 'vertical'}
          proportionalLayout={true}
          defaultSizes={group.children.map((child) => child.size || 50)}
          key={group.id}
          className="h-full"
        >
          {group.children.map((child) => (
            <Allotment.Pane key={child.id}>
              {renderAssistantPanelGroup(child)}
            </Allotment.Pane>
          ))}
        </Allotment>
      );
    }
    
    return null;
  }, [renderAssistantPanelWrapper]);

  // Detect Mac platform for keyboard shortcut display
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    }
  }, []);

  // Mobile drawer management: ensure only one drawer is open at a time
  // Note: Assistant panel can stay open with other drawers, but nav and file sidebar close others
  useEffect(() => {
    if (!isMobile) return;
    
    if (mobileNavOpen) {
      setMobileFileSidebarOpen(false);
      // Don't close assistant panel when nav opens - user might want both
    }
  }, [isMobile, mobileNavOpen]);

  useEffect(() => {
    if (!isMobile) return;
    
    if (mobileFileSidebarOpen) {
      setMobileNavOpen(false);
      // Don't close assistant panel when file sidebar opens - user might want both
    }
  }, [isMobile, mobileFileSidebarOpen]);

  // On mobile, auto-collapse sidebars by default, but open assistant panel
  useEffect(() => {
    if (isMobile) {
      setIsFileSidebarCollapsed(true);
      setIsAssistantPanelCollapsed(true);
      // Open assistant panel by default on mobile
      setMobileAssistantOpen(true);
    } else {
      // Restore desktop state when switching back
      setIsFileSidebarCollapsed(false);
      setIsAssistantPanelCollapsed(false);
      setMobileAssistantOpen(false);
    }
  }, [isMobile]);

  // Listen for keybind updates
  useEffect(() => {
    function handleKeybindsUpdate() {
      setKeybinds(getStoredKeybinds())
    }
    
    window.addEventListener('keybinds-updated', handleKeybindsUpdate)
    return () => window.removeEventListener('keybinds-updated', handleKeybindsUpdate)
  }, []);

  // Register global keyboard shortcuts - use capture phase to ensure they work universally
  useEffect(() => {
    const keyboardHandler = createWorkspacesKeyboardHandler({
      setFileSearchOpen,
      setIsFileSidebarCollapsed,
    })
    // Use capture phase to ensure shortcuts work before other handlers
    window.addEventListener('keydown', keyboardHandler, true)
    return () => {
      window.removeEventListener('keydown', keyboardHandler, true)
    }
  }, []);

  // Listen for create-new-ai-tab events to create a new tab in the active assistant panel
  // Supports optional detail.label to set a custom tab label (used by PlanViewer agents)
  useEffect(() => {
    const handleCreateNewTab = (event: Event) => {
      const customEvent = event as CustomEvent<{ label?: string }>
      const label = customEvent.detail?.label
      // Use the active assistant panel ID, or fallback to the default
      const targetPanelId = activeAssistantPanelId || 'assistant-main-panel'
      handleAssistantTabAdd(targetPanelId, label)
      // Also activate the panel to ensure it's visible
      setActiveAssistantPanelId(targetPanelId)
    }

    window.addEventListener('create-new-ai-tab', handleCreateNewTab)
    return () => {
      window.removeEventListener('create-new-ai-tab', handleCreateNewTab)
    }
  }, [activeAssistantPanelId, handleAssistantTabAdd]);

  // Listen for open-ai-panel events to ensure the assistant panel is visible
  // This is used by plan execution to ensure the user can see the agent running
  useEffect(() => {
    const handleOpenAiPanel = () => {
      setIsAssistantPanelCollapsed(false)
      if (isMobile) {
        setMobileAssistantOpen(true)
      }
    }

    window.addEventListener('open-ai-panel', handleOpenAiPanel)
    return () => {
      window.removeEventListener('open-ai-panel', handleOpenAiPanel)
    }
  }, [isMobile]);

  // Set global active AI tab ID for plan execution coordination
  // This allows the PlanViewer to know which AI tab to send messages to
  useEffect(() => {
    // Helper to find the active panel in the dock layout
    const findActivePanel = (group: PanelGroup): Panel | null => {
      if (group.type === 'panel' && group.panel) {
        if (group.panel.id === activeAssistantPanelId) {
          return group.panel
        }
      }
      if (group.type === 'split' && group.children) {
        for (const child of group.children) {
          const found = findActivePanel(child)
          if (found) return found
        }
      }
      return null
    }

    const activePanel = findActivePanel(assistantDockLayout)
    const activeTabId = activePanel?.activeTabId || activePanel?.tabs[0]?.id

    if (activeTabId) {
      (window as any).__banburyActiveAiTabId = activeTabId
      
      // Also populate __banburyAiTabs and register threadIds for PlanViewer bridge
      if (activePanel?.tabs) {
        (window as any).__banburyAiTabs = activePanel.tabs
        
        // Register all tab threadIds in the thread map
        const threadMap = (window as any).__banburyTabThreadMap || {}
        activePanel.tabs.forEach((tab: any) => {
          if (tab.threadId) {
            threadMap[tab.id] = tab.threadId
          }
        })
        ;(window as any).__banburyTabThreadMap = threadMap
      }
    }

    return () => {
      delete (window as any).__banburyActiveAiTabId
    }
  }, [assistantDockLayout, activeAssistantPanelId]);

  const handleCreateWordDocumentWrapper = async (documentName: string) => {
    await handleCreateWordDocument(userInfo, setUploading, toast, triggerSidebarRefresh, documentName);
  };

  const handleCreateSpreadsheetWrapper = async (spreadsheetName: string) => {
    await handleCreateSpreadsheet(userInfo, setUploading, toast, triggerSidebarRefresh, spreadsheetName);
  };

  const handleCreateNotebookWrapper = async (notebookName: string) => {
    await handleCreateNotebook(userInfo, setUploading, toast, triggerSidebarRefresh, notebookName);
  };

  const handleCreateDrawioWrapper = async (diagramName: string) => {
    await handleCreateDrawio(userInfo, setUploading, toast, triggerSidebarRefresh, diagramName);
  };

  const handleCreateTldrawWrapper = async (canvasName: string) => {
    await handleCreateTldraw(userInfo, setUploading, toast, triggerSidebarRefresh, canvasName);
  };

  const handleCreatePowerpointWrapper = async (presentationName: string) => {
    await handleCreatePowerpoint(userInfo, setUploading, toast, triggerSidebarRefresh, presentationName);
  };

  const handleGenerateImage = async () => {
    const prompt = window.prompt('Describe the image to generate') || '';
    if (!prompt.trim()) return;
    
    // Get image generation model from tool preferences
    let imageModel = 'dall-e-3';
    try {
      const saved = localStorage.getItem('toolPreferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        imageModel = prefs.image_generation_model || 'dall-e-3';
      }
    } catch {}
    
    await handleCreateImage(
      userInfo,
      setUploading,
      toast,
      triggerSidebarRefresh,
      { prompt, size: '1024x1024', folder: 'images', model: imageModel }
    );
  };



  const handleCreateFolder = () => {
    if (!userInfo?.username) return;
    setFolderCreationTrigger(true);
    setTimeout(() => setFolderCreationTrigger(false), 100);
  };

  // Handle compose email - now opens in a tab
  const handleComposeEmailCallback = useCallback(() => {
    handleComposeEmail(activePanelId, addTabToPanel, setPanelLayout, setActivePanelId);
  }, [activePanelId, addTabToPanel, setPanelLayout, setActivePanelId]);

  const openTaskInTabCallback = useCallback((task: Task | null, targetPanelId: string = activePanelId) => {
    openTaskInTab(
      task,
      targetPanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout
    );
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout]);

  const openMeetingInTabCallback = useCallback((meeting: MeetingSession | null, targetPanelId: string = activePanelId) => {
    openMeetingInTab(
      meeting,
      targetPanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout
    );
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout]);

  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task);
    openTaskInTabCallback(task, activePanelId);
  }, [openTaskInTabCallback, activePanelId]);

  const handleCreateTask = useCallback(() => {
    openTaskInTabCallback(null, activePanelId); // null means create task composer
  }, [openTaskInTabCallback, activePanelId]);

  const handleMeetingSelect = useCallback((meeting: MeetingSession) => {
    setSelectedMeeting(meeting);
    openMeetingInTabCallback(meeting, activePanelId);
  }, [openMeetingInTabCallback, activePanelId]);

  const handleJoinMeeting = useCallback(() => {
    openMeetingInTabCallback(null, activePanelId); // null means join meeting composer
  }, [openMeetingInTabCallback, activePanelId]);

  const handleFileDeletedCallback = useCallback((fileId: string) => {
    handleFileDeleted(fileId, selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh);
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh]);

  const handleFileRenamedCallback = useCallback((oldPath: string, newPath: string) => {
    handleFileRenamed(oldPath, newPath, selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh);
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh]);

  // Handle file moved - using extracted function
  const handleFileMovedWrapper = useCallback((fileId: string, oldPath: string, newPath: string) => {
    handleFileMoved({
      fileId,
      oldPath,
      newPath,
      selectedFile,
      setPanelLayout,
      setSelectedFile,
      triggerSidebarRefresh
    });
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh]);

  const handleFolderCreated = useCallback((folderPath: string) => {
    // Show success toast
    toast({
      title: "Folder created successfully",
      description: `Folder "${folderPath}" has been created.`,
      variant: "success",
    });
    // Refresh sidebar to show the new folder
    triggerSidebarRefresh();
  }, [toast, triggerSidebarRefresh]);

  const handleFolderRenamedCallback = useCallback((oldPath: string, newPath: string) => {
    handleFolderRenamed(oldPath, newPath, selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh, toast);
  }, [selectedFile, toast, triggerSidebarRefresh]);


  useEffect(() => {
    // Ensure dark mode is enabled
    window.localStorage.setItem('themeMode', 'dark');
    
    // Clean up demo mode if active
    if (typeof window !== 'undefined' && (window as any).__DEMO_MODE_ACTIVE__) {
      (window as any).__DEMO_MODE_ACTIVE__ = false;
    }
    
    const checkAuthAndFetchUser = async () => {
      try {
        setLoading(true);
        
        // Validate token first using ApiService
        const isValidToken = await ApiService.validateToken();

        if (!isValidToken) {
          // Token is invalid, redirect to login
          router.push('/login');
          return;
        }

        // Token is valid, create user info from stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        const basicUserInfo: UserInfo = {
          username: username || 'User',
          email: localStorage.getItem('userEmail') || username || '',
          first_name: '',
          last_name: '',
          picture: null
        };
        setUserInfo(basicUserInfo);
        
        // Trigger a file refresh after userInfo is set to ensure real files are loaded
        setTimeout(() => {
          triggerSidebarRefresh();
        }, 500);
      } catch (err) {
        // Still try to show basic info if we have some stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        if (username) {
          const basicUserInfo: UserInfo = {
            username: username,
            email: localStorage.getItem('userEmail') || username,
            first_name: '',
            last_name: '',
            picture: null
          };
          setUserInfo(basicUserInfo);
          
          // Trigger a file refresh here too
          setTimeout(() => {
            triggerSidebarRefresh();
          }, 500);
        } else {
          router.push('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    const trackWorkspaceVisit = async () => {
      try {
        await ApiService.trackWorkspaceVisit();
      } catch (error) {
        // Silently fail - don't interrupt user experience
      }
    };

    checkAuthAndFetchUser();

    setTimeout(() => {
      trackWorkspaceVisit();
    }, 1000); // Small delay to ensure auth is complete
  }, [router, triggerSidebarRefresh]);

  // Listen for requests to reopen a file (e.g., after save generates a new file id)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const { newFile } = detail as { oldPath?: string; newFile: FileSystemItem };
      if (!newFile) return;
      // Close any tab showing the old path, then open the new file in the active panel
      try {
        const allTabs = getAllTabs(panelLayout);
        const fileTabs = allTabs.filter(t => (t as any).type === 'file');
        const targets = fileTabs.filter(t => (t as any).file.path === (detail.oldPath || newFile.path));
        targets.forEach(t => handleCloseTabCallback((t as any).id, activePanelId));
      } catch {}
      openFileInTabCallback(newFile, activePanelId);
    };
    window.addEventListener('workspace-reopen-file', handler as EventListener);
    return () => window.removeEventListener('workspace-reopen-file', handler as EventListener);
  }, [panelLayout, activePanelId, openFileInTabCallback, handleCloseTabCallback, getAllTabs]);

  // Listen for assistant-open-browser events to open a virtual browser tab
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const { viewerUrl, title } = detail;
      if (!viewerUrl) return;

      const virtualName = `${title || 'Browser Session'}.browserbase`;
      const virtualPath = `browserbase/${virtualName}?viewerUrl=${encodeURIComponent(viewerUrl)}&title=${encodeURIComponent(title || 'Browser Session')}`;
      const file: FileSystemItem = {
        id: virtualPath,
        file_id: virtualPath,
        name: virtualName,
        type: 'file',
        path: virtualPath,
      } as FileSystemItem;

      // Always open browser sessions in the middle (main) panel
      openFileInTabCallback(file, 'main-panel');
    };
    window.addEventListener('assistant-open-browser', handler as EventListener);
    return () => window.removeEventListener('assistant-open-browser', handler as EventListener);
  }, [openFileInTabCallback]);

  // Listen for file sidebar refresh events (from AI file modifications)
  useEffect(() => {
    const handler = () => {
      triggerSidebarRefresh();
    };
    window.addEventListener('file-sidebar-refresh', handler);
    return () => window.removeEventListener('file-sidebar-refresh', handler);
  }, [triggerSidebarRefresh]);
  
  // Load conversations on mount
  useEffect(() => {
    if (userInfo?.username) {
      loadConversationsCallback();
    }
  }, [userInfo?.username]);
  
  // Apply global drag styles (cursor only)
  useEffect(() => {
    if (dragState.isDragging) document.body.classList.add('drag-cursor');
    else document.body.classList.remove('drag-cursor');

    return () => document.body.classList.remove('drag-cursor');
  }, [dragState.isDragging]);

  // Register panels as drop targets with closest-edge (panel body only) - covers both dock roots
  useEffect(() => {
    const panelNodes = Array.from(document.querySelectorAll('[data-panel-id]')) as HTMLElement[];
    const cleanups: Array<() => void> = [];
    panelNodes.forEach((element) => {
      const panelId = element.getAttribute('data-panel-id');
      if (!panelId) return;
      const cleanup = dropTargetForElements({
        element,
        getData: (args: any) =>
          attachClosestEdge({ type: 'panel', panelId }, {
            element,
            input: args.input,
            allowedEdges: ['left', 'right', 'top', 'bottom'],
          }),
        onDrag: (args: any) => {
          if (!args?.source?.data || args.source.data.type !== 'tab') return;
          const edge = extractClosestEdge(args.self.data);
          setDragState((prev) => ({
            ...prev,
            dropTargetPanel: panelId,
            dropZone: edge as any,
          }));
        },
        onDragLeave: () => {
          setDragState((prev) => ({ ...prev, dropZone: null, dropTargetPanel: null }));
        },
        onDrop: () => {
          setDragState((prev) => ({ ...prev, dropZone: null, dropTargetPanel: null }));
        },
      });
      cleanups.push(cleanup);
    });

    return () => cleanups.forEach((fn) => fn());
  }, [panelLayout, assistantDockLayout]);

  // Global monitor: create split on drop based on closest edge - handles cross-dock moves
  useEffect(() => {
    // Helper to find tab in both layouts
    const findTabInAllLayouts = (tabId: string): { tab: WorkspaceTab | null; sourceLayout: 'main' | 'assistant'; sourcePanelId: string | null } => {
      // Check main layout first
      const mainTabs = getAllTabs(panelLayout);
      const mainTab = mainTabs.find((t) => t.id === tabId);
      if (mainTab) {
        let sourcePanelId: string | null = null;
        const findSource = (layout: PanelGroup): void => {
          if (layout.type === 'panel' && layout.panel) {
            if (layout.panel.tabs.some((t) => t.id === tabId)) {
              sourcePanelId = layout.panel.id;
            }
          } else if (layout.type === 'group' && layout.children) {
            layout.children.forEach(findSource);
          }
        };
        findSource(panelLayout);
        return { tab: mainTab, sourceLayout: 'main', sourcePanelId };
      }
      
      // Check assistant layout
      const assistantTabs = getAllTabs(assistantDockLayout);
      const assistantTab = assistantTabs.find((t) => t.id === tabId);
      if (assistantTab) {
        let sourcePanelId: string | null = null;
        const findSource = (layout: PanelGroup): void => {
          if (layout.type === 'panel' && layout.panel) {
            if (layout.panel.tabs.some((t) => t.id === tabId)) {
              sourcePanelId = layout.panel.id;
            }
          } else if (layout.type === 'group' && layout.children) {
            layout.children.forEach(findSource);
          }
        };
        findSource(assistantDockLayout);
        return { tab: assistantTab, sourceLayout: 'assistant', sourcePanelId };
      }
      
      return { tab: null, sourceLayout: 'main', sourcePanelId: null };
    };
    
    // Determine which dock root a panel belongs to
    const getTargetDockRoot = (panelId: string): 'main' | 'assistant' => {
      return panelId.startsWith('assistant-') ? 'assistant' : 'main';
    };

    return monitorForElements({
      onDragStart({ source, location }: any) {
        if (source?.data?.type !== 'tab') return;
        const { tab: dragged } = findTabInAllLayouts(source.data.id);
        const input = location?.current?.input;
        const pos = input && typeof input.clientX === 'number' && typeof input.clientY === 'number'
          ? { x: input.clientX, y: input.clientY }
          : null;
        setDragState((prev) => ({
          ...prev,
          isDragging: true,
          draggedTab: dragged,
          draggedFromPanel: source.data.panelId || null,
          dragStartPosition: pos,
          currentPosition: pos || prev.currentPosition,
        }));
      },
      onDrag({ source, location }: any) {
        if (source?.data?.type !== 'tab') return;
        const input = location?.current?.input;
        if (input && typeof input.clientX === 'number' && typeof input.clientY === 'number') {
          const pos = { x: input.clientX, y: input.clientY };
          setDragState((prev) => ({ ...prev, currentPosition: pos }));
        }
      },
      onDrop({ location, source }: any) {
        if (source.data.type !== 'tab') return;
        const tabId = source.data.id as string;

        // Determine target panel and edge
        const target = location.current.dropTargets.find((t: any) => t.data && (t.data as any).type === 'panel');
        let edge = target ? (extractClosestEdge(target.data) as 'left' | 'right' | 'top' | 'bottom' | null) : null;
        let targetPanelId = target ? ((target.data as any).panelId as string) : '';

        // Fallback: compute panel and edge from mouse position when not detected (e.g., dropping over tab header)
        if (!target || !edge || !targetPanelId) {
          const pos = dragStateRef.current.currentPosition;
          if (!pos) {
            setDragState({
              isDragging: false,
              draggedTab: null,
              draggedFromPanel: null,
              dragStartPosition: null,
              currentPosition: null,
              dragDirection: null,
              dropZone: null,
              dropTargetPanel: null,
            });
            return;
          }
          const el = document.elementFromPoint(pos.x, pos.y) as HTMLElement | null;
          const panelEl = el ? (el.closest('[data-panel-id]') as HTMLElement | null) : null;
          if (!panelEl) {
            setDragState({
              isDragging: false,
              draggedTab: null,
              draggedFromPanel: null,
              dragStartPosition: null,
              currentPosition: null,
              dragDirection: null,
              dropZone: null,
              dropTargetPanel: null,
            });
            return;
          }
          const pid = panelEl.getAttribute('data-panel-id') || '';
          if (!pid) {
            setDragState({
              isDragging: false,
              draggedTab: null,
              draggedFromPanel: null,
              dragStartPosition: null,
              currentPosition: null,
              dragDirection: null,
              dropZone: null,
              dropTargetPanel: null,
            });
            return;
          }
          targetPanelId = pid;
          const rect = panelEl.getBoundingClientRect();
          const relX = Math.max(0, Math.min(pos.x - rect.left, rect.width));
          const relY = Math.max(0, Math.min(pos.y - rect.top, rect.height));
          const leftDist = relX;
          const rightDist = rect.width - relX;
          const topDist = relY;
          const bottomDist = rect.height - relY;
          const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
          if (minDist === leftDist) edge = 'left';
          else if (minDist === rightDist) edge = 'right';
          else if (minDist === topDist) edge = 'top';
          else edge = 'bottom';
        }

        if (!edge || !targetPanelId) {
          setDragState({
            isDragging: false,
            draggedTab: null,
            draggedFromPanel: null,
            dragStartPosition: null,
            currentPosition: null,
            dragDirection: null,
            dropZone: null,
            dropTargetPanel: null,
          });
          return;
        }

        // Find the dragged tab and its real source (across both layouts)
        const { tab: draggedTab, sourceLayout, sourcePanelId } = findTabInAllLayouts(tabId);
        if (!draggedTab || !sourcePanelId) {
          setDragState({
            isDragging: false,
            draggedTab: null,
            draggedFromPanel: null,
            dragStartPosition: null,
            currentPosition: null,
            dragDirection: null,
            dropZone: null,
            dropTargetPanel: null,
          });
          return;
        }

        const targetLayout = getTargetDockRoot(targetPanelId);
        const direction: SplitDirection = edge === 'left' || edge === 'right' ? 'horizontal' : 'vertical';
        
        // Remove tab from source layout
        if (sourceLayout === 'main') {
          setPanelLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
        } else {
          setAssistantDockLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
        }
        
        // Add tab to target layout via split
        if (targetLayout === 'main') {
          splitPanelCallback(targetPanelId, direction, draggedTab as FileTab);
        } else {
          // Split in assistant layout
          setAssistantDockLayout((prev) => {
            const newPanelId = `assistant-panel-${Date.now()}`;
            const newPanel: Panel = {
              id: newPanelId,
              tabs: [draggedTab],
              activeTabId: draggedTab.id
            };
            
            const splitInLayout = (layout: PanelGroup): PanelGroup => {
              if (layout.type === 'panel' && layout.panel?.id === targetPanelId) {
                return {
                  id: `group-${Date.now()}`,
                  type: 'group',
                  direction,
                  children: [
                    { ...layout, size: 50 },
                    {
                      id: newPanelId,
                      type: 'panel',
                      panel: newPanel,
                      size: 50
                    }
                  ]
                };
              }
              if (layout.type === 'group' && layout.children) {
                return {
                  ...layout,
                  children: layout.children.map((child) => splitInLayout(child))
                };
              }
              return layout;
            };
            
            return splitInLayout(prev);
          });
          setActiveAssistantPanelId(`assistant-panel-${Date.now()}`);
        }

        // Reset drag state after handling drop
        setDragState({
          isDragging: false,
          draggedTab: null,
          draggedFromPanel: null,
          dragStartPosition: null,
          currentPosition: null,
          dragDirection: null,
          dropZone: null,
          dropTargetPanel: null,
        });
      },
    });
  }, [panelLayout, assistantDockLayout, getAllTabs, removeTabFromPanel, splitPanelCallback]);

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    router.push('/');
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }



  return (
    <TooltipProvider>
      <TiptapAIProvider>
        <ClaudeRuntimeProvider>
          <div 
            className="flex h-screen overflow-hidden bg-background dark:bg-background"
            onClick={(e) => {
              // Check if the click is outside any CSV editor
              const target = e.target as HTMLElement;
              const isCSVEditorClick = target.closest('.csv-editor-container') || 
                                     target.closest('.handsontable-container-full') || 
                                     target.closest('.ht_master') ||
                                     target.closest('[role="menu"]') ||
                                     target.closest('[role="dialog"]');
              
              // If click is outside CSV editor, dispatch event to deselect cells
              if (!isCSVEditorClick) {
                window.dispatchEvent(new CustomEvent('workspace-outside-click'));
              }
            }}
          >

          {/* Navigation Sidebar - Fixed (hidden on mobile) */}
          <div className="hidden md:block">
            <NavSidebar
              onLogout={handleLogout}
              activeTab={activeLeftPanelTab}
              onTabChange={setActiveLeftPanelTab}
              showAdminToggle={userInfo?.username === 'mmills' || userInfo?.username === 'mmills6060@gmail.com'}
            />
          </div>
          
          {/* Mobile Header - Always present on mobile */}
          {isMobile && (
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background">
              <div className="px-2 py-1.5 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between w-full touch-target bg-background">
                <div className="flex items-center gap-1">
                  {/* Mobile Navigation Drawer */}
                  <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[32px] min-w-[32px] border-zinc-300 dark:border-white/[0.06] touch-target p-0">
                        <Menu className="h-3.5 w-3.5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 mobile-sheet-expand">
                      <SheetHeader className="px-4 py-3 border-b border-zinc-300 dark:border-white/[0.06]">
                        <SheetTitle className="text-foreground mobile-text text-base font-semibold">Navigation</SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-auto py-4">
                        <div className="flex flex-col gap-2 px-4">
                          {[
                            { id: 'workspaces', icon: FolderOpen, label: 'Workspaces', path: '/workspaces' },
                            { id: 'knowledge', icon: Brain, label: 'Knowledge', path: '/knowledge' },
                            ...(userInfo?.username === 'mmills' || userInfo?.username === 'mmills6060@gmail.com' 
                              ? [{ id: 'admin', icon: UserStarIcon, label: 'Admin', path: '/admin' }]
                              : []),
                          ].map((item) => {
                            const Icon = item.icon;
                            const isActive = router.pathname === item.path;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  router.push(item.path);
                                  setMobileNavOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors touch-target min-h-[44px] ${
                                  isActive
                                    ? 'bg-accent dark:bg-accent text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent'
                                }`}
                              >
                                <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1} />
                                <span className="mobile-text">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="px-4 pt-4 border-t border-zinc-300 dark:border-white/[0.06]">
                          <button
                            onClick={() => {
                              handleLogout();
                              setMobileNavOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 touch-target min-h-[44px]"
                          >
                            <LogOut className="h-5 w-5 flex-shrink-0" strokeWidth={1} />
                            <span className="mobile-text">Logout</span>
                          </button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                  
                  {/* File Sidebar Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 min-h-[32px] min-w-[32px] border-zinc-300 dark:border-white/[0.06] touch-target p-0"
                    onClick={() => setMobileFileSidebarOpen(true)}
                    title="Files"
                  >
                    <Files className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Assistant Panel Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 min-h-[32px] min-w-[32px] border-zinc-300 dark:border-white/[0.06] touch-target p-0"
                    onClick={() => setMobileAssistantOpen(true)}
                    title="Assistant"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Main Content Area with Resizable Panels */}
          <div className={`flex flex-1 ${isMobile ? 'pt-[44px]' : 'md:ml-[48px]'} flex-col overflow-hidden min-h-0`}>
            {/* Workspaces Top Bar */}
            <WorkspacesTopBar
              isFileSidebarCollapsed={isFileSidebarCollapsed}
              isAssistantPanelCollapsed={isAssistantPanelCollapsed}
              onToggleFileSidebar={() => setIsFileSidebarCollapsed(prev => !prev)}
              onToggleAssistantPanel={() => setIsAssistantPanelCollapsed(prev => !prev)}
            />

            {/* Mobile File Sidebar Drawer */}
            {isMobile && (
              <Sheet open={mobileFileSidebarOpen} onOpenChange={setMobileFileSidebarOpen}>
                <SheetContent side="left" className="w-[320px] sm:w-[360px] p-0 mobile-sheet-expand">
                  <div className="h-full flex flex-col">
                    <div className="px-4 py-3 bg-card">
                      <SheetTitle className="text-foreground mobile-text text-base font-semibold">Files</SheetTitle>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <LeftPanel
                        currentView="workspaces"
                        userInfo={userInfo}
                        activeTab={activeLeftPanelTab}
                        onTabChange={setActiveLeftPanelTab}
                        onAdminTabClick={(tabId) => {
                          openAdminInTabCallback(tabId, activePanelId);
                          setMobileFileSidebarOpen(false);
                        }}
                        onFileSelect={(file) => {
                          handleFileSelect(file);
                          setMobileFileSidebarOpen(false);
                        }}
                        selectedFile={selectedFile}
                        refreshTrigger={refreshTrigger}
                        onFileDeleted={handleFileDeletedCallback}
                        onFileRenamed={handleFileRenamedCallback}
                        onFileMoved={handleFileMovedWrapper}
                        onFolderCreated={handleFolderCreated}
                        onFolderRenamed={handleFolderRenamedCallback}
                        triggerRootFolderCreation={folderCreationTrigger}
                        onEmailSelect={(email) => {
                          handleEmailSelect(email);
                          setMobileFileSidebarOpen(false);
                        }}
                        onComposeEmail={handleComposeEmailCallback}
                        onCreateDocument={handleCreateWordDocumentWrapper}
                        onCreateSpreadsheet={handleCreateSpreadsheetWrapper}
                        onCreateNotebook={handleCreateNotebookWrapper}
                        onCreateDrawio={handleCreateDrawioWrapper}
                        onCreateTldraw={handleCreateTldrawWrapper}
                        onCreatePowerpoint={handleCreatePowerpointWrapper}
                        onGenerateImage={handleGenerateImage}
                        onCreateFolder={handleCreateFolder}
                        onEventSelect={(event) => {
                          handleCalendarEventSelectCallback(event);
                          setMobileFileSidebarOpen(false);
                        }}
                        onOpenCalendar={() => {
                          openCalendarInTabCallback(activePanelId);
                          setMobileFileSidebarOpen(false);
                        }}
                        onTaskSelect={(task) => {
                          handleTaskSelect(task);
                          setMobileFileSidebarOpen(false);
                        }}
                        selectedTask={selectedTask}
                        onCreateTask={() => {
                          handleCreateTask();
                          setMobileFileSidebarOpen(false);
                        }}
                        onMeetingSelect={(meeting) => {
                          handleMeetingSelect(meeting);
                          setMobileFileSidebarOpen(false);
                        }}
                        selectedMeeting={selectedMeeting}
                        onJoinMeeting={() => {
                          handleJoinMeeting();
                          setMobileFileSidebarOpen(false);
                        }}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* Mobile Assistant Panel Drawer */}
            {isMobile && (
              <Sheet open={mobileAssistantOpen} onOpenChange={setMobileAssistantOpen}>
                <SheetContent side="right" className="w-full sm:w-[400px] p-0 [&>button]:hidden mobile-sheet-expand-right">
                  <div className="h-full flex flex-col">
                    {/* Mobile Toolbar in Assistant Panel */}
                    <div className="px-2 py-1.5 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between w-full touch-target bg-background">
                      <div className="flex items-center gap-1">
                        {/* Mobile Navigation Drawer */}
                        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[32px] min-w-[32px] border-zinc-300 dark:border-white/[0.06] touch-target p-0">
                              <Menu className="h-3.5 w-3.5" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 mobile-sheet-expand">
                            <SheetHeader className="px-4 py-3 border-b border-zinc-300 dark:border-white/[0.06]">
                              <SheetTitle className="text-foreground mobile-text text-base font-semibold">Navigation</SheetTitle>
                            </SheetHeader>
                            <div className="flex-1 overflow-auto py-4">
                              <div className="flex flex-col gap-2 px-4">
                                {[
                                  { id: 'workspaces', icon: FolderOpen, label: 'Workspaces', path: '/workspaces' },
                                  { id: 'knowledge', icon: Brain, label: 'Knowledge', path: '/knowledge' },
                                  ...(userInfo?.username === 'mmills' || userInfo?.username === 'mmills6060@gmail.com' 
                                    ? [{ id: 'admin', icon: UserStarIcon, label: 'Admin', path: '/admin' }]
                                    : []),
                                ].map((item) => {
                                  const Icon = item.icon;
                                  const isActive = router.pathname === item.path;
                                  return (
                                    <button
                                      key={item.id}
                                      onClick={() => {
                                        router.push(item.path);
                                        setMobileNavOpen(false);
                                      }}
                                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors touch-target min-h-[44px] ${
                                        isActive
                                          ? 'bg-accent dark:bg-accent text-foreground'
                                          : 'text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent'
                                      }`}
                                    >
                                      <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1} />
                                      <span className="mobile-text">{item.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="px-4 pt-4 border-t border-zinc-300 dark:border-white/[0.06]">
                                <button
                                  onClick={() => {
                                    handleLogout();
                                    setMobileNavOpen(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 touch-target min-h-[44px]"
                                >
                                  <LogOut className="h-5 w-5 flex-shrink-0" strokeWidth={1} />
                                  <span className="mobile-text">Logout</span>
                                </button>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                        
                        {/* File Sidebar Toggle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 min-h-[32px] min-w-[32px] border-zinc-300 dark:border-white/[0.06] touch-target p-0"
                          onClick={() => {
                            setMobileFileSidebarOpen(true);
                            setMobileAssistantOpen(false);
                          }}
                          title="Files"
                        >
                          <Files className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Assistant Panel Toggle - Close button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 min-h-[32px] min-w-[32px] border-zinc-300 dark:border-white/[0.06] touch-target p-0"
                          onClick={() => setMobileAssistantOpen(false)}
                          title="Close Assistant"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div 
                        data-assistant-dock 
                        className="h-full relative"
                      >
                        {renderAssistantPanelGroup(assistantDockLayout)}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* Resizable Panels */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* File Sidebar Panel - Desktop Only */}
                {!isMobile && (
                  <div 
                    className={`h-full flex-shrink-0 overflow-hidden ${
                      isFileSidebarCollapsed ? 'w-0 transition-all duration-300 ease-in-out' : 'transition-all duration-300 ease-in-out'
                    }`}
                    style={!isFileSidebarCollapsed ? { 
                      width: `${leftPanelWidth}px`,
                      transition: isResizing ? 'none' : undefined
                    } : undefined}
                  >
                    <div 
                      className="h-full"
                      style={!isFileSidebarCollapsed ? { width: `${leftPanelWidth}px` } : undefined}
                    >
                      <div className="h-full flex flex-col relative">
                        {/* Resize handle */}
                        {!isFileSidebarCollapsed && (
                          <div
                            onMouseDown={handleResizeStart}
                            className={`absolute right-0 top-0 bottom-0 cursor-ew-resize z-30 transition-colors ${
                              isResizing ? 'bg-accent' : 'hover:bg-accent/50'
                            }`}
                            style={{ 
                              touchAction: 'none',
                              width: '4px',
                              marginRight: '-2px'
                            }}
                            title="Drag to resize"
                          />
                        )}
                        {/* Collapse button for file sidebar - positioned on right border, offset to avoid resize handle */}
                        {!isFileSidebarCollapsed && (
                          <button
                            onClick={() => setIsFileSidebarCollapsed(true)}
                            className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-20 h-11 w-11 md:h-6 md:w-6 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background border border-zinc-300 dark:border-white/[0.06] transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black shadow-soft burger-button"
                            title="Collapse file sidebar"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <Menu className="h-4 w-4 md:h-4 md:w-4" strokeWidth={1} />
                          </button>
                        )}
                        {/* File Sidebar Content */}
                        <div className="flex-1 overflow-hidden">
                          <LeftPanel
                            currentView="workspaces"
                            userInfo={userInfo}
                            activeTab={activeLeftPanelTab}
                            onTabChange={setActiveLeftPanelTab}
                            onAdminTabClick={(tabId) => openAdminInTabCallback(tabId, activePanelId)}
                            onFileSelect={handleFileSelect}
                            selectedFile={selectedFile}
                            refreshTrigger={refreshTrigger}
                            onFileDeleted={handleFileDeletedCallback}
                            onFileRenamed={handleFileRenamedCallback}
                            onFileMoved={handleFileMovedWrapper}
                            onFolderCreated={handleFolderCreated}
                            onFolderRenamed={handleFolderRenamedCallback}
                            triggerRootFolderCreation={folderCreationTrigger}
                            onEmailSelect={handleEmailSelect}
                            onComposeEmail={handleComposeEmailCallback}
                            onCreateDocument={handleCreateWordDocumentWrapper}
                            onCreateSpreadsheet={handleCreateSpreadsheetWrapper}
                            onCreateNotebook={handleCreateNotebookWrapper}
                            onCreateDrawio={handleCreateDrawioWrapper}
                            onCreateTldraw={handleCreateTldrawWrapper}
                            onCreatePowerpoint={handleCreatePowerpointWrapper}
                            onGenerateImage={handleGenerateImage}
                            onCreateFolder={handleCreateFolder}
                            onEventSelect={handleCalendarEventSelectCallback}
                            onOpenCalendar={() => openCalendarInTabCallback(activePanelId)}
                            onTaskSelect={handleTaskSelect}
                            selectedTask={selectedTask}
                            onCreateTask={handleCreateTask}
                            onMeetingSelect={handleMeetingSelect}
                            selectedMeeting={selectedMeeting}
                            onJoinMeeting={handleJoinMeeting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0 overflow-hidden min-h-0">
                  <Allotment className="h-full">
                
                {/* Main Content Panel - Show when tabs are open */}
                {getAllTabs(panelLayout).length > 0 && (
                  <Allotment.Pane minSize={isMobile ? 300 : 400} preferredSize={isMobile ? 800 : 1200}>
                    <MiddlePanel
                      isFileSidebarCollapsed={isMobile ? true : isFileSidebarCollapsed}
                      isAssistantPanelCollapsed={isMobile ? true : isAssistantPanelCollapsed}
                      panelLayout={panelLayout}
                      onToggleFileSidebar={() => {
                        if (isMobile) {
                          setMobileFileSidebarOpen(true);
                        } else {
                          setIsFileSidebarCollapsed(false);
                        }
                      }}
                      onToggleAssistantPanel={() => {
                        if (isMobile) {
                          setMobileAssistantOpen(true);
                        } else {
                          setIsAssistantPanelCollapsed(false);
                        }
                      }}
                      renderPanelGroup={renderPanelGroup}
                      hasFilesOpen={getAllTabs(panelLayout).length > 0}
                    />
                  </Allotment.Pane>
                )}
                
                {/* Assistant Panel - Dock-based with draggable tabs - Desktop Only */}
                {!isMobile && !isAssistantPanelCollapsed && (
                  <Allotment.Pane minSize={isMobile ? 200 : 280}>
                    <div 
                      data-assistant-dock 
                      className="h-full relative"
                    >
                      {/* Collapse button for assistant panel - positioned on left border */}
                      {(selectedFile || selectedEmail || getAllTabs(panelLayout).some(tab => tab.type === 'calendar')) && (
                        <button
                          onClick={() => setIsAssistantPanelCollapsed(true)}
                          className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-20 h-11 w-11 md:h-6 md:w-6 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background border border-zinc-300 dark:border-white/[0.06] transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black shadow-soft burger-button"
                          title="Collapse assistant panel"
                        >
                          <Menu className="h-4 w-4 md:h-4 md:w-4" strokeWidth={1} />
                        </button>
                      )}
                      {renderAssistantPanelGroup(assistantDockLayout)}
                    </div>
                  </Allotment.Pane>
                )}
                  </Allotment>
                </div>
              </div>
            </div>
          </div>
          
          {/* Context Menu */}
          {contextMenu && (
            <div
              className="fixed bg-zinc-800 border border-white/[0.06] rounded-md shadow-soft-md py-2 z-50"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={closeContextMenu}
            >
              <div className="px-4 py-2 text-zinc-400 text-sm border-b border-white/[0.06]">
                Tip: Drag the tab to create a new panel
              </div>
              <button
                onClick={() => {
                  if (contextMenu) {
                    handleCloseTabCallback(contextMenu.tabId, contextMenu.panelId);
                  }
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-zinc-700 flex items-center gap-2"
              >
                <X size={16} strokeWidth={1} />
                Close Tab
              </button>
        </div>
          )}
          
          {/* Click outside to close context menu */}
          {contextMenu && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={closeContextMenu}
            />
          )}

        </div>
        
        {/* Conversation Dialogs */}
        {saveDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-lg p-6 w-96 shadow-soft-md">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Save Conversation</h3>
              <input
                type="text"
                placeholder="Enter conversation title..."
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                className="w-full p-3 bg-zinc-800 border border-white/[0.06] rounded text-white mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setSaveDialogOpen(false);
                    setConversationTitle("");
                  }}
                  className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurrentConversationCallback}
                  disabled={!conversationTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showConversationDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-lg p-6 w-96 max-h-96 overflow-y-auto shadow-soft-md">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Load Conversation</h3>
              {isLoadingConversations ? (
                <div className="text-zinc-900 dark:text-white text-center py-4">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-white text-center py-4">No saved conversations found.</div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      className="flex items-center justify-between p-3 bg-zinc-800 rounded border border-white/[0.06]"
                    >
                      <div className="flex-1">
                        <div className="text-white font-medium">{conversation.title}</div>
                        <div className="text-zinc-400 text-sm">
                          {new Date(conversation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadConversationCallback(conversation._id)}
                          className="p-2 text-blue-400 hover:text-blue-300"
                          title="Load conversation"
                        >
                          <FolderOpen className="h-4 w-4" strokeWidth={1} />
                        </button>
                        <button
                          onClick={() => deleteConversationCallback(conversation._id)}
                          className="p-2 text-red-400 hover:text-red-300"
                          title="Delete conversation"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowConversationDialog(false)}
                  className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Split Zones for visual feedback */}
        <SplitZones
          isVisible={dragState.isDragging}
          mousePosition={dragState.currentPosition}
        />

        <style>{`
          html, body {
            overflow: hidden;
            height: 100%;
          }
          #__next {
            height: 100%;
            overflow: hidden;
          }
          .drag-cursor {
            cursor: grabbing !important;
          }
          .drag-cursor * {
            cursor: grabbing !important;
          }
          .select-none {
            user-select: none;
          }
          /* VSCode-style tabs (Olympus Tabs use .tab class) */
          .tab {
            border: none;
            transition: background-color 150ms ease, color 150ms ease;
          }
          .tab:hover {
            border: none;
            box-shadow: none;
          }
          .tab--active {
            border: none;
          }
          /* Panel collapse/expand transitions */
          .panel-transition {
            transition: all 0.3s ease-in-out;
          }
          /* Burger button styling */
          .burger-button {
            transition: all 0.2s ease-in-out;
          }
          .burger-button:hover {
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          /* Touch-friendly targets - minimum 44x44px on mobile */
          @media (max-width: 767px) {
            /* Mobile Sheet expanding animations - horizontal slide only */
            .mobile-sheet-expand[data-slot="sheet-content"][data-state="open"] {
              animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            .mobile-sheet-expand[data-slot="sheet-content"][data-state="closed"] {
              animation: slideOutLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            @keyframes slideInRight {
              from {
                transform: translateX(-100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes slideOutLeft {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(-100%);
                opacity: 0;
              }
            }
            /* Right panel (assistant) expanding animation - horizontal slide only */
            .mobile-sheet-expand-right[data-slot="sheet-content"][data-state="open"] {
              animation: slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            .mobile-sheet-expand-right[data-slot="sheet-content"][data-state="closed"] {
              animation: slideOutRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            @keyframes slideInLeft {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes slideOutRight {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(100%);
                opacity: 0;
              }
            }
            .touch-target {
              min-height: 44px;
              min-width: 44px;
            }
            /* Ensure buttons in mobile header are touch-friendly */
            button[class*="h-11"] {
              min-height: 44px;
              min-width: 44px;
            }
            /* Improve spacing for mobile */
            .mobile-spacing {
              padding: 0.75rem;
              gap: 0.75rem;
            }
            /* Responsive typography */
            .mobile-text {
              font-size: 0.875rem;
              line-height: 1.5;
            }
          }
        `}</style>



        </ClaudeRuntimeProvider>
      </TiptapAIProvider>
      <FileSearchCommand 
        open={fileSearchOpen}
        onOpenChange={setFileSearchOpen}
        onFileSelect={handleFileSelect}
        onEmailSelect={handleSearchEmailSelect}
        onCalendarEventSelect={handleCalendarEventSelectCallback}
      />
      <Toaster />
    </TooltipProvider>
  );
};
export default Workspaces;