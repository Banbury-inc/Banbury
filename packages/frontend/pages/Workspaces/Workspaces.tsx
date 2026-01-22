import { Allotment } from 'allotment';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ClaudeRuntimeProvider } from '../../assistant/ClaudeRuntimeProvider/ClaudeRuntimeProvider';
import { LeftPanel } from "../../components/LeftPanel/LeftPanel";
import { MiddlePanel } from "../../components/MiddlePanel/MiddlePanel";
import { NavSidebar } from "../../components/nav-sidebar";
import { WorkspacesTopBar } from "../../components/WorkspacesTopBar/WorkspacesTopBar";
import { FileSystemItem } from '../../utils/fileTreeUtils';
import 'allotment/dist/style.css';
import { X, Menu } from 'lucide-react';
import { SplitZones } from '../../components/common/SplitZones';
import { useRouter } from 'next/router';
import { useIsMobile } from '../../hooks/use-mobile';
import { dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { TiptapAIProvider } from '../../contexts/TiptapAIContext';
import { TooltipProvider } from "../../components/ui/tooltip";
import { Toaster } from "../../components/ui/toaster";
import { useToast } from "../../components/ui/use-toast";
import { ApiService } from '../../../backend/api/apiService';
import { extractEmailContent } from '../../utils/emailUtils';
import { handleCreateSpreadsheet } from './handlers/handleCreateSpreadsheet';
import { handleCreateWordDocument } from './handlers/handleCreateWordDocument';
import { handleCreateNotebook } from './handlers/handleCreateNotebook';
import { handleCreateDrawio } from './handlers/handleCreateDrawio';
import { handleCreateTldraw } from './handlers/handleCreateTldraw';
import { handleCreatePowerpoint } from './handlers/handleCreatePowerpoint';
import { renderPanel } from './handlers/renderPanel';
import { handleFileMoved } from './handlers/handleFileMoved';
import { handleFolderRenamed } from './handlers/handleFolderRenamed';
import { handleFileDeleted } from './handlers/handleFileDeleted';
import { handleFileRenamed } from './handlers/handleFileRenamed';
import { splitPanel } from './handlers/splitPanel';
import { openCalendarInTab } from './handlers/openCalendarInTab';
import { handleCalendarEventSelect } from './handlers/handleCalendarEventSelect';
import { handleMeetingSelect as handleMeetingSelectHandler } from './handlers/handleMeetingSelect';
import { handleReplyToEmail } from './handlers/handleReplyToEmail';
import { handleComposeEmail } from './handlers/handleComposeEmail';
import { loadConversations, loadConversation, deleteConversation } from './handlers/conversationManagement';
import { findPanel, getAllTabs, updatePanelActiveTab, addTabToPanel, removeTabFromPanel } from './handlers/panelUtils';
import { findTabInAllLayouts } from './handlers/findTabInAllLayouts';
import { openFileInTab, openEmailInTab, openTaskInTab, openMeetingInTab, openAdminInTab, handleCloseTab, handleTabChange } from './handlers/tabManagement';
import { isDrawioFile, isTldrawFile, isPowerPointFile } from './handlers/fileTypeUtils';
import { createWorkspacesKeyboardHandler } from './handlers/createWorkspacesKeyboardHandler';
import { renderAssistantPanel } from './handlers/renderAssistantPanel';
import { AiTabRuntimeHost } from './handlers/AiTabRuntimeHost';
import { useLeftPanelResize } from './handlers/handleLeftPanelResize';
import { checkAuthAndFetchUser } from './handlers/checkAuthAndFetchUser';
import { handleDesktopRecordingStarted as handleDesktopRecordingStartedHandler } from './handlers/handleDesktopRecordingStarted';
import { handleGenerateImage as handleGenerateImageHandler } from './handlers/handleGenerateImage';
import { createRenderPanelGroup } from './handlers/renderPanelGroup';
import { 
  getStoredKeybinds, 
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
  Panel,
  SplitDirection,
  PanelGroup,
  AiTab,
  DragState,
} from './types';
import { createInitialAiTab, createAiTab } from '../../components/RightPanel/handlers/aiTabHandlers';
import { subscribeTodoEventListener } from '../../components/RightPanel/handlers/todoStoreHandlers';
import { createTitleCandidateHandler } from './handlers/handleTitleCandidate';
import { createWorkspaceReopenFileHandler, WORKSPACE_REOPEN_FILE_EVENT } from './handlers/handleWorkspaceReopenFile';
import { createAssistantOpenBrowserHandler, ASSISTANT_OPEN_BROWSER_EVENT } from './handlers/handleAssistantOpenBrowser';
import { createFileSidebarRefreshHandler, FILE_SIDEBAR_REFRESH_EVENT } from './handlers/handleFileSidebarRefresh';
import { createOpenPresentationInViewerHandler, OPEN_PRESENTATION_IN_VIEWER_EVENT } from './handlers/handleOpenPresentationInViewer';
import { createWorkspaceFindAndOpenFileHandler, WORKSPACE_FIND_AND_OPEN_FILE_EVENT } from './handlers/handleWorkspaceFindAndOpenFile';
import { createKeybindsUpdateHandler, KEYBINDS_UPDATED_EVENT } from './handlers/handleKeybindsUpdate';
import { createCreateNewAiTabHandler, CREATE_NEW_AI_TAB_EVENT } from './handlers/handleCreateNewAiTab';
import { createOpenAiPanelHandler, OPEN_AI_PANEL_EVENT } from './handlers/handleOpenAiPanel';
import { MobileFileSidebar } from './MobileFileSidebar';
import { MobileWorkspaceHeader } from './MobileWorkspaceHeader';
import { MobileAssistantPanel } from './MobileAssistantPanel';




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
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [meetingsRefreshTrigger, _setMeetingsRefreshTrigger] = useState<number>(0);
  const [folderCreationTrigger, setFolderCreationTrigger] = useState<boolean>(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
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
    const handleTitleCandidate = createTitleCandidateHandler(setAssistantDockLayout)
    window.addEventListener('assistant-ai-tab-title-candidate', handleTitleCandidate)
    return () => {
      window.removeEventListener('assistant-ai-tab-title-candidate', handleTitleCandidate)
    }
  }, [setAssistantDockLayout])

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

  const loadConversationCallback = async (conversationId: string, tabId?: string) => {
    await loadConversation(conversationId, toast, tabId);
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
  const renderPanelGroup = useCallback(
    createRenderPanelGroup({
      renderPanelWrapper,
      isMac,
      keybinds,
      isMobile
    }),
    [renderPanelWrapper, isMac, keybinds, isMobile]
  )

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
    const handler = createKeybindsUpdateHandler({ setKeybinds })
    window.addEventListener(KEYBINDS_UPDATED_EVENT, handler)
    return () => window.removeEventListener(KEYBINDS_UPDATED_EVENT, handler)
  }, [setKeybinds])

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
  useEffect(() => {
    const handler = createCreateNewAiTabHandler({
      activeAssistantPanelId,
      handleAssistantTabAdd,
      setActiveAssistantPanelId
    }) as EventListener
    window.addEventListener(CREATE_NEW_AI_TAB_EVENT, handler)
    return () => window.removeEventListener(CREATE_NEW_AI_TAB_EVENT, handler)
  }, [activeAssistantPanelId, handleAssistantTabAdd, setActiveAssistantPanelId])

  // Listen for open-ai-panel events to ensure the assistant panel is visible
  useEffect(() => {
    const handler = createOpenAiPanelHandler({
      setIsAssistantPanelCollapsed,
      isMobile,
      setMobileAssistantOpen
    })
    window.addEventListener(OPEN_AI_PANEL_EVENT, handler)
    return () => window.removeEventListener(OPEN_AI_PANEL_EVENT, handler)
  }, [setIsAssistantPanelCollapsed, isMobile, setMobileAssistantOpen])

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
    }
    
    // Populate __banburyAiTabs with AI tabs from BOTH layouts for plan execution coordination
    // This ensures agents are discoverable even when dragged between docks
    const mainTabs = getAllTabs(panelLayout)
    const assistantTabs = getAllTabs(assistantDockLayout)
    const allAiTabs = [...mainTabs, ...assistantTabs].filter((t): t is AiTab => t.type === 'ai')
    ;(window as any).__banburyAiTabs = allAiTabs
    
    // Register all tab threadIds in the thread map
    const threadMap = (window as any).__banburyTabThreadMap || {}
    allAiTabs.forEach((tab) => {
      if (tab.threadId) {
        threadMap[tab.id] = tab.threadId
      }
    })
    ;(window as any).__banburyTabThreadMap = threadMap

    return () => {
      delete (window as any).__banburyActiveAiTabId
    }
  }, [panelLayout, assistantDockLayout, activeAssistantPanelId]);

  const handleGenerateImage = async () => {
    await handleGenerateImageHandler({
      userInfo,
      toast,
      triggerSidebarRefresh
    })
  }



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

  const openMeetingInTabCallback = useCallback(async (meeting: MeetingSession | null, targetPanelId: string = activePanelId) => {
    await openMeetingInTab(
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
    handleMeetingSelectHandler({
      meeting,
      setSelectedMeeting,
      openMeetingInTabCallback,
      activePanelId
    });
  }, [openMeetingInTabCallback, activePanelId, setSelectedMeeting]);

  const handleJoinMeeting = useCallback(() => {
    openMeetingInTabCallback(null, activePanelId); // null means join meeting composer
  }, [openMeetingInTabCallback, activePanelId]);

  // Handle desktop recording started - create a temporary meeting session and open in tab
  const handleDesktopRecordingStarted = useCallback((data: { sessionId: string; windowId: string; platform: string; meetingTitle: string }) => {
    handleDesktopRecordingStartedHandler({
      data,
      setSelectedMeeting,
      openMeetingInTabCallback,
      activePanelId
    })
  }, [openMeetingInTabCallback, activePanelId, setSelectedMeeting])

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
    

    const trackWorkspaceVisit = async () => {
      try {
        await ApiService.trackWorkspaceVisit();
      } catch (error) {
        // Silently fail - don't interrupt user experience
      }
    };

    checkAuthAndFetchUser(setLoading, router, setUserInfo, triggerSidebarRefresh);

    setTimeout(() => {
      trackWorkspaceVisit();
    }, 1000); // Small delay to ensure auth is complete
  }, [router, triggerSidebarRefresh]);

  // Listen for requests to reopen a file (e.g., after save generates a new file id)
  useEffect(() => {
    const handler = createWorkspaceReopenFileHandler({
      panelLayout,
      activePanelId,
      openFileInTabCallback,
      handleCloseTabCallback
    }) as EventListener
    window.addEventListener(WORKSPACE_REOPEN_FILE_EVENT, handler)
    return () => window.removeEventListener(WORKSPACE_REOPEN_FILE_EVENT, handler)
  }, [panelLayout, activePanelId, openFileInTabCallback, handleCloseTabCallback])

  // Listen for assistant-open-browser events to open a virtual browser tab
  useEffect(() => {
    const handler = createAssistantOpenBrowserHandler({ openFileInTabCallback }) as EventListener
    window.addEventListener(ASSISTANT_OPEN_BROWSER_EVENT, handler)
    return () => window.removeEventListener(ASSISTANT_OPEN_BROWSER_EVENT, handler)
  }, [openFileInTabCallback])

  // Listen for file sidebar refresh events (from AI file modifications)
  useEffect(() => {
    const handler = createFileSidebarRefreshHandler({ triggerSidebarRefresh })
    window.addEventListener(FILE_SIDEBAR_REFRESH_EVENT, handler)
    return () => window.removeEventListener(FILE_SIDEBAR_REFRESH_EVENT, handler)
  }, [triggerSidebarRefresh])

  // Listen for open-presentation-in-viewer events to auto-switch to new presentations
  useEffect(() => {
    const handler = createOpenPresentationInViewerHandler({
      triggerSidebarRefresh,
      openFileInTabCallback
    }) as EventListener
    window.addEventListener(OPEN_PRESENTATION_IN_VIEWER_EVENT, handler)
    return () => window.removeEventListener(OPEN_PRESENTATION_IN_VIEWER_EVENT, handler)
  }, [triggerSidebarRefresh, openFileInTabCallback])

  // Listen for workspace-find-and-open-file events to find and open files by name/path
  useEffect(() => {
    const handler = createWorkspaceFindAndOpenFileHandler({
      activePanelId,
      openFileInTabCallback,
      setFileSearchOpen
    }) as EventListener
    window.addEventListener(WORKSPACE_FIND_AND_OPEN_FILE_EVENT, handler)
    return () => window.removeEventListener(WORKSPACE_FIND_AND_OPEN_FILE_EVENT, handler)
  }, [activePanelId, openFileInTabCallback, setFileSearchOpen])

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
    // Determine which dock root a panel belongs to
    const getTargetDockRoot = (panelId: string): 'main' | 'assistant' => {
      return panelId.startsWith('assistant-') ? 'assistant' : 'main';
    };

    return monitorForElements({
      onDragStart({ source, location }: any) {
        if (source?.data?.type !== 'tab') return;
        const { tab: dragged } = findTabInAllLayouts(source.data.id, panelLayout, assistantDockLayout);
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
        const { tab: draggedTab, sourceLayout, sourcePanelId } = findTabInAllLayouts(tabId, panelLayout, assistantDockLayout);
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
  }, [panelLayout, assistantDockLayout, removeTabFromPanel, splitPanelCallback]);

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
          {/* AI Tab Runtime Host - keeps AI tab runtimes alive across panel moves */}
          <AiTabRuntimeHost
            panelLayout={panelLayout}
            assistantDockLayout={assistantDockLayout}
            userInfo={userInfo}
            selectedFile={selectedFile}
            selectedEmail={selectedEmail}
            onEmailSelect={handleEmailSelect}
          />

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
            <MobileWorkspaceHeader
              activeLeftPanelTab={activeLeftPanelTab}
              onTabChange={setActiveLeftPanelTab}
              onOpenFileSidebar={() => setMobileFileSidebarOpen(true)}
              onOpenAssistant={() => setMobileAssistantOpen(true)}
              userInfo={userInfo}
            />
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
              <MobileFileSidebar
                open={mobileFileSidebarOpen}
                onOpenChange={setMobileFileSidebarOpen}
                userInfo={userInfo}
                activeTab={activeLeftPanelTab}
                onTabChange={setActiveLeftPanelTab}
                activePanelId={activePanelId}
                selectedFile={selectedFile}
                selectedTask={selectedTask}
                selectedMeeting={selectedMeeting}
                refreshTrigger={refreshTrigger}
                folderCreationTrigger={folderCreationTrigger}
                meetingsRefreshTrigger={meetingsRefreshTrigger}
                onAdminTabClick={(tabId) => openAdminInTabCallback(tabId, activePanelId)}
                onFileSelect={handleFileSelect}
                onFileDeleted={handleFileDeletedCallback}
                onFileRenamed={handleFileRenamedCallback}
                onFileMoved={handleFileMovedWrapper}
                onFolderCreated={handleFolderCreated}
                onFolderRenamed={handleFolderRenamedCallback}
                onEmailSelect={handleEmailSelect}
                onComposeEmail={handleComposeEmailCallback}
                onCreateDocument={(name) => handleCreateWordDocument(userInfo, toast, triggerSidebarRefresh, name)}
                onCreateSpreadsheet={(name) => handleCreateSpreadsheet(userInfo, toast, triggerSidebarRefresh, name)}
                onCreateNotebook={(name) => handleCreateNotebook(userInfo, toast, triggerSidebarRefresh, name)}
                onCreateDrawio={(name) => handleCreateDrawio(userInfo, toast, triggerSidebarRefresh, name)}
                onCreateTldraw={(name) => handleCreateTldraw(userInfo, toast, triggerSidebarRefresh, name)}
                onCreatePowerpoint={(name) => handleCreatePowerpoint(userInfo, toast, triggerSidebarRefresh, name)}
                onGenerateImage={handleGenerateImage}
                onCreateFolder={handleCreateFolder}
                onEventSelect={handleCalendarEventSelectCallback}
                onOpenCalendar={() => openCalendarInTabCallback(activePanelId)}
                onTaskSelect={handleTaskSelect}
                onCreateTask={handleCreateTask}
                onMeetingSelect={handleMeetingSelect}
                onJoinMeeting={handleJoinMeeting}
                onDesktopRecordingStarted={handleDesktopRecordingStarted}
                onClose={() => setMobileFileSidebarOpen(false)}
              />
            )}

            {/* Mobile Assistant Panel Drawer */}
            {isMobile && (
              <MobileAssistantPanel
                open={mobileAssistantOpen}
                onOpenChange={setMobileAssistantOpen}
                activeLeftPanelTab={activeLeftPanelTab}
                onTabSelect={(tabId) => {
                  setActiveLeftPanelTab(tabId);
                  setMobileFileSidebarOpen(true);
                  setMobileAssistantOpen(false);
                }}
                onClose={() => setMobileAssistantOpen(false)}
                userInfo={userInfo}
                assistantDockLayout={assistantDockLayout}
                renderAssistantPanelGroup={renderAssistantPanelGroup}
              />
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
                            onCreateDocument={(name) => handleCreateWordDocument(userInfo, toast, triggerSidebarRefresh, name)}
                            onCreateSpreadsheet={(name) => handleCreateSpreadsheet(userInfo, toast, triggerSidebarRefresh, name)}
                            onCreateNotebook={(name) => handleCreateNotebook(userInfo, toast, triggerSidebarRefresh, name)}
                            onCreateDrawio={(name) => handleCreateDrawio(userInfo, toast, triggerSidebarRefresh, name)}
                            onCreateTldraw={(name) => handleCreateTldraw(userInfo, toast, triggerSidebarRefresh, name)}
                            onCreatePowerpoint={(name) => handleCreatePowerpoint(userInfo, toast, triggerSidebarRefresh, name)}
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
                            onDesktopRecordingStarted={handleDesktopRecordingStarted}
                            meetingsRefreshTrigger={meetingsRefreshTrigger}
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
          /* Burger button styling */
          .burger-button {
            transition: all 0.2s ease-in-out;
          }
          .burger-button:hover {
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          @media (max-width: 767px) {
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
