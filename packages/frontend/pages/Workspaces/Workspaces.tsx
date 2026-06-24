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
import { TiptapAIProvider } from '../../contexts/TiptapAIContext';
import { TooltipProvider } from "../../components/common/ui/tooltip";
import { Toaster } from "../../components/common/ui/toaster";
import { useToast } from "../../components/common/ui/use-toast";
import { ApiService } from '../../../backend/api/apiService';
import { renderPanel } from './handlers/renderPanel';
import { splitPanel } from './handlers/splitPanel';
import { openCalendarInTab } from '../../components/LeftPanel/components/CalendarTab/handlers/openCalendarInTab';
import { openFileBrowserInTab } from '../../components/LeftPanel/components/FilesTab/handlers/openFileBrowserInTab';
import { openEmailInboxInTab } from '../../components/LeftPanel/components/EmailTab/handlers/openEmailInboxInTab';
import { handleCalendarEventSelect } from '../../components/LeftPanel/components/CalendarTab/handlers/handleCalendarEventSelect';
import { handleMeetingSelect as handleMeetingSelectHandler } from '../../components/LeftPanel/components/MeetingsTab/handlers/handleMeetingSelect';
import { handleReplyToEmail } from '../../components/LeftPanel/components/EmailTab/handlers/handleReplyToEmail';
import { handleComposeEmail } from '../../components/LeftPanel/components/EmailTab/handlers/handleComposeEmail';
import { loadConversations, loadConversation, deleteConversation } from './handlers/conversationManagement';
import { findPanel, getAllTabs, updatePanelActiveTab, addTabToPanel, removeTabFromPanel } from './handlers/panelUtils';
import { openFileInTab, openEmailInTab, openTaskInTab, openMeetingInTab, openAdminInTab, openDatabaseTableInTab, openFlowInTab, openMapInTab, openImageUrlInTab, handleCloseTab, handleTabChange } from './handlers/tabManagement';
import { 
  isDrawioFile, 
  isTldrawFile, 
  isPowerPointFile, 
  isImageFile,
  isPdfFile,
  isDocumentFile,
  isSpreadsheetFile,
  isVideoFile,
  isCodeFile,
  isBrowserFile,
} from './handlers/fileTypeUtils';
import { createWorkspacesKeyboardHandler } from './handlers/createWorkspacesKeyboardHandler';
import { renderAssistantPanel } from './handlers/renderAssistantPanel';
import { AiTabRuntimeHost } from './handlers/AiTabRuntimeHost';
import { useLeftPanelResize } from './handlers/handleLeftPanelResize';
import { checkAuthAndFetchUser } from './handlers/checkAuthAndFetchUser';
import { handleDesktopRecordingStarted as handleDesktopRecordingStartedHandler } from './handlers/handleDesktopRecordingStarted';
import { createRenderPanelGroup } from './handlers/renderPanelGroup';
import { createDragMonitor } from './handlers/dragMonitor';
import { registerDropTargets } from './handlers/dropTargetRegistration';
import { extractReplyBody as extractReplyBodyHandler } from './handlers/extractReplyBody';
import { renderAssistantPanelGroup as renderAssistantPanelGroupHandler } from './handlers/renderAssistantPanelGroup';
import { setupActiveAiTabId } from './handlers/activeAiTabId';
import { handleFileSelect as handleFileSelectHandler } from '../../components/LeftPanel/components/FilesTab/handlers/handleFileSelect';
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
  FlowItem,
  OpenDatabaseTablePayload,
  ImageUrlTabPayload,
  MapPlaceLocation,
  Panel,
  SplitDirection,
  PanelGroup,
  DragState,
} from './types';
import { createInitialAiTab, createAiTab } from '../../components/RightPanel/handlers/aiTabHandlers';
import { subscribeTodoEventListener } from '../../components/RightPanel/handlers/todoStoreHandlers';
import { createTitleCandidateHandler } from './handlers/handleTitleCandidate';
import { createWorkspaceReopenFileHandler, WORKSPACE_REOPEN_FILE_EVENT } from './handlers/handleWorkspaceReopenFile';
import { createAssistantOpenBrowserHandler, ASSISTANT_OPEN_BROWSER_EVENT } from './handlers/handleAssistantOpenBrowser';
import { createFileSidebarRefreshHandler, FILE_SIDEBAR_REFRESH_EVENT } from '../../components/LeftPanel/components/FilesTab/handlers/handleFileSidebarRefresh';
import { createOpenPresentationInViewerHandler, OPEN_PRESENTATION_IN_VIEWER_EVENT } from './handlers/handleOpenPresentationInViewer';
import { createWorkspaceFindAndOpenFileHandler, WORKSPACE_FIND_AND_OPEN_FILE_EVENT } from './handlers/handleWorkspaceFindAndOpenFile';
import { createKeybindsUpdateHandler, KEYBINDS_UPDATED_EVENT } from './handlers/handleKeybindsUpdate';
import { createCreateNewAiTabHandler, CREATE_NEW_AI_TAB_EVENT } from './handlers/handleCreateNewAiTab';
import { createOpenAiPanelHandler, OPEN_AI_PANEL_EVENT } from './handlers/handleOpenAiPanel';
import { createAssistantOpenMapHandler, ASSISTANT_OPEN_MAP_EVENT } from './handlers/handleAssistantOpenMap';
import { MobileFileSidebar } from './MobileFileSidebar';
import { MobileWorkspaceHeader } from './MobileWorkspaceHeader';
import { MobileAssistantPanel } from './MobileAssistantPanel';
import { getStoredPanelState, saveStoredPanelState } from './handlers/panelStorage';




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
  const [selectedFlow, setSelectedFlow] = useState<FlowItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [meetingsRefreshTrigger, _setMeetingsRefreshTrigger] = useState<number>(0);
  const [folderCreationTrigger] = useState<boolean>(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<any>(null);
  const [activePanelId, setActivePanelId] = useState<string>('main-panel');
  const [isFileSidebarCollapsed, setIsFileSidebarCollapsed] = useState(() => getStoredPanelState().isFileSidebarCollapsed);
  const [isAssistantPanelCollapsed, setIsAssistantPanelCollapsed] = useState(() => getStoredPanelState().isAssistantPanelCollapsed);
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

  const setStoredFileSidebarCollapsed = useCallback((collapsed: boolean) => {
    setIsFileSidebarCollapsed(collapsed)
    saveStoredPanelState({ isFileSidebarCollapsed: collapsed })
  }, [])

  const toggleStoredFileSidebarCollapsed = useCallback(() => {
    setIsFileSidebarCollapsed((prev) => {
      const next = !prev
      saveStoredPanelState({ isFileSidebarCollapsed: next })
      return next
    })
  }, [])

  const setStoredAssistantPanelCollapsed = useCallback((collapsed: boolean) => {
    setIsAssistantPanelCollapsed(collapsed)
    saveStoredPanelState({ isAssistantPanelCollapsed: collapsed })
  }, [])

  const toggleStoredAssistantPanelCollapsed = useCallback(() => {
    setIsAssistantPanelCollapsed((prev) => {
      const next = !prev
      saveStoredPanelState({ isAssistantPanelCollapsed: next })
      return next
    })
  }, [])


  // File type checking functions are imported from fileTypeUtils

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
    handleFileSelectHandler({
      file,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout,
      setSelectedFile,
    });
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout, setSelectedFile]);

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

  const openDatabaseTableInTabCallback = useCallback((payload: OpenDatabaseTablePayload, targetPanelId: string = activePanelId) => {
    openDatabaseTableInTab(
      payload,
      targetPanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout
    )
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout])

  const openMapInTabCallback = useCallback((
    place: MapPlaceLocation | null = null,
    targetPanelId: string = activePanelId,
    highlightedPlaces?: MapPlaceLocation[],
    title?: string
  ) => {
    openMapInTab(
      place,
      targetPanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout,
      highlightedPlaces,
      title
    )
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout])

  const openImageUrlInTabCallback = useCallback((image: ImageUrlTabPayload, targetPanelId: string = activePanelId) => {
    openImageUrlInTab(
      image,
      targetPanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout
    )
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout])

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

  const openFileBrowserInTabCallback = useCallback((targetPanelId: string = activePanelId) => {
    openFileBrowserInTab(targetPanelId, activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout);
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout]);

  const openEmailInboxInTabCallback = useCallback((targetPanelId: string = activePanelId) => {
    openEmailInboxInTab(targetPanelId, activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout);
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
    return extractReplyBodyHandler(email);
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
      panelLayout,
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
      openFileInTabCallback,
      openEmailInTabCallback,
      openImageUrlInTabCallback,
      setSelectedFile,
      setSelectedEmail,
      toast,
    });
  }, [activePanelId, dragState, userInfo, replyToEmail, setActivePanelId, handleTabChangeCallback, handleCloseTabCallback, handleReplyToEmailCallback, triggerSidebarRefresh, extractReplyBody, isImageFile, isPdfFile, isDocumentFile, isSpreadsheetFile, isVideoFile, isCodeFile, isBrowserFile, isDrawioFile, isTldrawFile, isPowerPointFile, panelLayout, setPanelLayout, setDragState, calendarJumpDate, handleCalendarJumpComplete, calendarSelectedEvent, handleCalendarSelectedEventConsumed, selectedFile, selectedEmail, handleEmailSelect, openFileInTabCallback, openEmailInTabCallback, openImageUrlInTabCallback, setSelectedFile, setSelectedEmail, toast]);
  
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
    return renderAssistantPanelGroupHandler({ group, renderAssistantPanelWrapper });
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
      const storedPanelState = getStoredPanelState()
      setIsFileSidebarCollapsed(storedPanelState.isFileSidebarCollapsed);
      setIsAssistantPanelCollapsed(storedPanelState.isAssistantPanelCollapsed);
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
      setIsFileSidebarCollapsed: toggleStoredFileSidebarCollapsed,
      setIsAssistantPanelCollapsed: toggleStoredAssistantPanelCollapsed,
    })
    // Use capture phase to ensure shortcuts work before other handlers
    window.addEventListener('keydown', keyboardHandler, true)
    return () => {
      window.removeEventListener('keydown', keyboardHandler, true)
    }
  }, [toggleStoredFileSidebarCollapsed, toggleStoredAssistantPanelCollapsed]);

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
      setIsAssistantPanelCollapsed: setStoredAssistantPanelCollapsed,
      isMobile,
      setMobileAssistantOpen
    })
    window.addEventListener(OPEN_AI_PANEL_EVENT, handler)
    return () => window.removeEventListener(OPEN_AI_PANEL_EVENT, handler)
  }, [setStoredAssistantPanelCollapsed, isMobile, setMobileAssistantOpen])

  // Set global active AI tab ID for plan execution coordination
  // This allows the PlanViewer to know which AI tab to send messages to
  useEffect(() => {
    return setupActiveAiTabId({
      panelLayout,
      assistantDockLayout,
      activeAssistantPanelId,
    });
  }, [panelLayout, assistantDockLayout, activeAssistantPanelId]);

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

  const openFlowInTabCallback = useCallback((flow: FlowItem | null, targetPanelId: string = activePanelId) => {
    openFlowInTab(
      flow,
      targetPanelId,
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

  const handleFlowSelect = useCallback((flow: FlowItem) => {
    setSelectedFlow(flow);
    openFlowInTabCallback(flow, activePanelId);
  }, [openFlowInTabCallback, activePanelId]);

  // Handle desktop recording started - create a temporary meeting session and open in tab
  const handleDesktopRecordingStarted = useCallback((data: { sessionId: string; windowId: string; platform: string; meetingTitle: string }) => {
    handleDesktopRecordingStartedHandler({
      data,
      setSelectedMeeting,
      openMeetingInTabCallback,
      activePanelId
    })
  }, [openMeetingInTabCallback, activePanelId, setSelectedMeeting])


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

  // Listen for assistant-open-map events to open or update the map viewer
  useEffect(() => {
    const handler = createAssistantOpenMapHandler({
      openMapInTabCallback,
      toast,
    }) as EventListener
    window.addEventListener(ASSISTANT_OPEN_MAP_EVENT, handler)
    return () => window.removeEventListener(ASSISTANT_OPEN_MAP_EVENT, handler)
  }, [openMapInTabCallback, toast])

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
    return registerDropTargets({
      panelLayout,
      assistantDockLayout,
      setDragState,
    });
  }, [panelLayout, assistantDockLayout, setDragState]);

  // Global monitor: create split on drop based on closest edge - handles cross-dock moves
  useEffect(() => {
    return createDragMonitor({
      panelLayout,
      assistantDockLayout,
      dragStateRef,
      setDragState,
      setPanelLayout,
      setAssistantDockLayout,
      setActiveAssistantPanelId,
      splitPanelCallback,
    });
  }, [panelLayout, assistantDockLayout, dragStateRef, setDragState, setPanelLayout, setAssistantDockLayout, setActiveAssistantPanelId, splitPanelCallback]);




  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }



  return (
    <TooltipProvider>
      <TiptapAIProvider>
        <ClaudeRuntimeProvider>
          <div 
            className="flex h-screen overflow-hidden bg-background"
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
              onToggleFileSidebar={toggleStoredFileSidebarCollapsed}
              onToggleAssistantPanel={toggleStoredAssistantPanelCollapsed}
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
                onFolderCreated={handleFolderCreated}
                onEmailSelect={handleEmailSelect}
                onComposeEmail={handleComposeEmailCallback}
                onEventSelect={handleCalendarEventSelectCallback}
                onOpenCalendar={() => openCalendarInTabCallback(activePanelId)}
                onTaskSelect={handleTaskSelect}
                onCreateTask={handleCreateTask}
                onMeetingSelect={handleMeetingSelect}
                onJoinMeeting={handleJoinMeeting}
                onDesktopRecordingStarted={handleDesktopRecordingStarted}
                onOpenDatabaseTable={payload => openDatabaseTableInTabCallback(payload, activePanelId)}
                selectedFlow={selectedFlow}
                setSelectedFlow={setSelectedFlow}
                onFlowSelect={handleFlowSelect}
                onClose={() => setMobileFileSidebarOpen(false)}
                panelLayout={panelLayout}
                setPanelLayout={setPanelLayout}
                setActivePanelId={setActivePanelId}
                setSelectedFile={setSelectedFile}
                triggerSidebarRefresh={triggerSidebarRefresh}
                toast={toast}
                setSelectedEmail={setSelectedEmail}
                setReplyToEmail={setReplyToEmail}
                setCalendarJumpDate={setCalendarJumpDate}
                setCalendarSelectedEvent={setCalendarSelectedEvent}
                setSelectedTask={setSelectedTask}
                setSelectedMeeting={setSelectedMeeting}
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
                            onClick={() => setStoredFileSidebarCollapsed(true)}
                            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 md:h-6 md:w-6 text-foreground hover:bg-accent bg-background border border-border transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-soft burger-button"
                            title="Collapse file sidebar"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <Menu className="h-4 w-4" strokeWidth={1} />
                          </button>
                        )}
                        {/* File Sidebar Content */}
                        <div className="flex-1 overflow-hidden">
                          <LeftPanel
                            userInfo={userInfo}
                            activeTab={activeLeftPanelTab}
                            eagerMountWorkspaceTabs
                            onAdminTabClick={(tabId) => openAdminInTabCallback(tabId, activePanelId)}
                            selectedFile={selectedFile}
                            refreshTrigger={refreshTrigger}
                            onFolderCreated={handleFolderCreated}
                            triggerRootFolderCreation={folderCreationTrigger}
                            onOpenCalendar={() => openCalendarInTabCallback(activePanelId)}
                            onOpenFiles={() => openFileBrowserInTabCallback(activePanelId)}
                            onOpenEmailInbox={() => openEmailInboxInTabCallback(activePanelId)}
                            selectedTask={selectedTask}
                            selectedMeeting={selectedMeeting}
                            meetingsRefreshTrigger={meetingsRefreshTrigger}
                            // Workspace dependencies for FilesTab
                            activePanelId={activePanelId}
                            panelLayout={panelLayout}
                            setPanelLayout={setPanelLayout}
                            setActivePanelId={setActivePanelId}
                            setSelectedFile={setSelectedFile}
                            triggerSidebarRefresh={triggerSidebarRefresh}
                            toast={toast}
                            setSelectedEmail={setSelectedEmail}
                            setReplyToEmail={setReplyToEmail}
                            setCalendarJumpDate={setCalendarJumpDate}
                            setCalendarSelectedEvent={setCalendarSelectedEvent}
                            setSelectedTask={setSelectedTask}
                            setSelectedMeeting={setSelectedMeeting}
                            onOpenDatabaseTable={payload => openDatabaseTableInTabCallback(payload, activePanelId)}
                            selectedFlow={selectedFlow}
                            setSelectedFlow={setSelectedFlow}
                            onFlowSelect={handleFlowSelect}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0 overflow-hidden min-h-0">
                  <Allotment className="h-full">
                
                {/* Main Content Panel */}
                  <Allotment.Pane minSize={isMobile ? 300 : 400} preferredSize={isMobile ? 800 : 1200}>
                    <MiddlePanel
                      isFileSidebarCollapsed={isMobile ? true : isFileSidebarCollapsed}
                      isAssistantPanelCollapsed={isMobile ? true : isAssistantPanelCollapsed}
                      panelLayout={panelLayout}
                      onToggleFileSidebar={() => {
                        if (isMobile) {
                          setMobileFileSidebarOpen(true);
                        } else {
                          setStoredFileSidebarCollapsed(false);
                        }
                      }}
                      onToggleAssistantPanel={() => {
                        if (isMobile) {
                          setMobileAssistantOpen(true);
                        } else {
                          setStoredAssistantPanelCollapsed(false);
                        }
                      }}
                      renderPanelGroup={renderPanelGroup}
                      hasFilesOpen={getAllTabs(panelLayout).length > 0}
                    />
                  </Allotment.Pane>
                
                {/* Assistant Panel - Dock-based with draggable tabs - Desktop Only */}
                {!isMobile && !isAssistantPanelCollapsed && (
                  <Allotment.Pane minSize={isMobile ? 200 : 280} preferredSize={isMobile ? 320 : 380}>
                    <div 
                      data-assistant-dock 
                      className="h-full relative"
                    >
                      {/* Collapse button for assistant panel - positioned on left border */}
                      {(selectedFile || selectedEmail || getAllTabs(panelLayout).some(tab => tab.type === 'calendar')) && (
                        <button
                          onClick={() => setStoredAssistantPanelCollapsed(true)}
                          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 md:h-6 md:w-6 text-foreground hover:bg-accent bg-background border border-border transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background shadow-soft burger-button"
                          title="Collapse assistant panel"
                        >
                          <Menu className="h-4 w-4" strokeWidth={1} />
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
              className="fixed bg-popover border border-border rounded-md shadow-soft-md py-2 z-50"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={closeContextMenu}
            >
              <div className="px-4 py-2 text-muted-foreground text-sm border-b border-border">
                Tip: Drag the tab to create a new panel
              </div>
              <button
                onClick={() => {
                  if (contextMenu) {
                    handleCloseTabCallback(contextMenu.tabId, contextMenu.panelId);
                  }
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-popover-foreground hover:bg-accent flex items-center gap-2"
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
            box-shadow: 0 4px 12px color-mix(in oklch, var(--color-foreground) 20%, transparent);
          }
          @media (max-width: 767px) {
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
